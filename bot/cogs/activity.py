import time

import discord
from discord import app_commands
from discord.ext import commands


class Activity(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.client = bot

    @app_commands.command(name="activity", description="View a user's activity stats.")
    async def activity_user(
        self,
        interaction: discord.Interaction,
        user: discord.Member = None,
    ):
        await interaction.response.defer()

        member = interaction.guild.get_member(user.id if user else interaction.user.id)

        conn = self.client.db.getconn()
        cur = conn.cursor()

        cur.execute("SELECT * FROM activities WHERE user_id = %s", (str(member.id),))
        user_data = cur.fetchall()

        cur.close()
        self.client.db.putconn(conn)

        all_activities = (
            "\n".join(
                [
                    f"`{activity[2]}` - {activity[5]}s - <t:{int(activity[4])}:R>"
                    for activity in user_data
                ]
            )
            or "*No activities tracked.*"
        )

        current_activities = (
            "\n".join(
                [
                    f"`{activity}` - <t:{int(self.client.activity_sessions.get(member.id)[activity]["time"])}:R>"
                    for activity in self.client.activity_sessions.get(member.id, [])
                ]
            )
            or "*No active activities.*"
        )

        embed = discord.Embed(
            colour=discord.Colour.purple(),
            title=f"{member.name}'s activity",
            description=f"**Total time wasted -** TIME\n\n**Current activities:**\n{current_activities}\n\n**All activities:**\n{all_activities}",
        )

        await interaction.followup.send(embed=embed)

    def update_activity(self, user_id, activity):
        activity_name = activity["name"]
        start_time = activity["start_time"]
        end_time = activity["end_time"]

        conn = self.client.db.getconn()
        cur = conn.cursor()

        cur.execute("SELECT * FROM users WHERE id = %s", (str(user_id),))
        existing_user = cur.fetchone()

        # If user does not exist, insert them into the users table
        if not existing_user:
            cur.execute("INSERT INTO users (id) VALUES (%s)", (str(user_id),))

        # Check if the activity already exists in the activities table
        cur.execute(
            """
            SELECT id, total_time FROM activities
            WHERE user_id = %s AND name = %s
            """,
            (str(user_id), activity_name),
        )
        existing_activity = cur.fetchone()

        time_played = end_time - start_time

        # If activity exists, update the activity
        if existing_activity:
            activity_id = existing_activity[0]
            existing_time_played = existing_activity[1]

            total_time = existing_time_played + time_played

            cur.execute(
                """
                UPDATE activities
                SET start_time = %s, end_time = %s, total_time = %s
                WHERE id = %s
                """,
                (start_time, end_time, total_time, activity_id),
            )
        # If activity doesn't exist, insert a new record
        else:
            cur.execute(
                """
                INSERT INTO activities (user_id, name, start_time, end_time, total_time)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (str(user_id), activity_name, start_time, end_time, time_played),
            )

        conn.commit()

        cur.close()
        self.client.db.putconn(conn)

    @commands.Cog.listener()
    async def on_presence_update(self, before: discord.Member, after: discord.Member):

        if self.client.activity_sessions.get(before.id) is None:
            self.client.activity_sessions[before.id] = {}

        last_played = int(time.time())

        after_activities = [activity.name for activity in after.activities]
        before_activities = [activity.name for activity in before.activities]

        if len(self.client.activity_sessions[before.id]) != len(after.activities):
            for activity in after.activities:
                if (
                    activity.name not in before_activities
                    or activity.name not in self.client.activity_sessions[before.id]
                ):
                    timestamp = getattr(activity, "timestamps", {}).get("start", None)
                    if timestamp:
                        timestamp /= 1000
                    else:
                        timestamp = int(time.time())

                    self.client.activity_sessions[before.id][activity.name] = {
                        "time": int(timestamp),
                        "custom": isinstance(activity, discord.CustomActivity),
                    }

            for activity in before_activities:
                if (
                    activity not in after_activities
                    and activity in self.client.activity_sessions[before.id]
                ):
                    try:
                        data = self.client.activity_sessions[before.id].pop(activity)
                        self.update_activity(
                            before.id,
                            {
                                "name": activity,
                                "start_time": data["time"],
                                "end_time": last_played,
                                "custom": data["custom"],
                            },
                        )
                    except Exception as e:
                        print("An error occurred while updating user's activity.", e)


async def setup(bot):
    await bot.add_cog(Activity(bot))
