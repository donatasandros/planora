import time

import discord
from discord.ext import commands


class Events(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print(f"Logged in as:\n{self.bot.user} ({self.bot.user.id})")

    async def update_activity(self, user_id, activity):
        """Log activity start and end times in the database."""
        activity_name = activity["name"]
        start_time = activity["start_time"]
        end_time = activity["end_time"]

        time_played = end_time - start_time

        existing_user = await self.bot.db.fetch(
            "SELECT * FROM users WHERE id = $1", str(user_id)
        )

        if not existing_user:
            await self.bot.db.execute(
                "INSERT INTO users (id) VALUES ($1)", str(user_id)
            )

        await self.bot.db.execute(
            """
            INSERT INTO activities (user_id, name, start_time, end_time, total_time)
            VALUES ($1, $2, $3, $4, $5)
            """,
            str(user_id),
            activity_name,
            start_time,
            end_time,
            time_played,
        )

    @commands.Cog.listener()
    async def on_presence_update(self, before: discord.Member, after: discord.Member):
        """Tracks and updates user presence in the database."""

        # Ensure the user has an entry in `activity_sessions`
        if before.id not in self.bot.activity_sessions:
            self.bot.activity_sessions[before.id] = {}

        last_played = int(time.time())

        # Get lists of activities before and after update
        after_activities = [activity.name for activity in after.activities]
        before_activities = [activity.name for activity in before.activities]

        if len(self.bot.activity_sessions[before.id]) != len(after.activities):
            # Handle newly started activities
            for activity in after.activities:
                if (
                    activity.name not in before_activities
                    or activity.name not in self.bot.activity_sessions[before.id]
                ):
                    timestamp = getattr(activity, "timestamps", {}).get("start", None)
                    if timestamp:
                        timestamp //= 1000  # Convert milliseconds to seconds
                    else:
                        timestamp = int(time.time())

                    self.bot.activity_sessions[before.id][activity.name] = {
                        "time": int(timestamp),
                    }

            # Handle ended activities
            for activity in before_activities:
                if (
                    activity not in after_activities
                    and activity in self.bot.activity_sessions[before.id]
                ):
                    try:
                        data = self.bot.activity_sessions[before.id].pop(activity)
                        await self.update_activity(
                            before.id,
                            {
                                "name": activity,
                                "start_time": data["time"],
                                "end_time": last_played,
                            },
                        )
                    except Exception as e:
                        print(
                            f"[ERROR] An error occurred while updating user's activity: {e}"
                        )


async def setup(bot):
    await bot.add_cog(Events(bot))
