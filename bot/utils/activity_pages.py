import discord
from discord.ext import commands

from utils.time import format_time


async def create_activity_pages(bot: commands.Bot, user: discord.Member):
    """Creates paginated activity pages for a user, including both current and past activities."""

    try:
        # Get the user's past activities
        past_activities = await bot.db.fetch(
            """
            SELECT name, SUM(total_time), MAX(end_time)
            FROM activities
            WHERE user_id = $1
            GROUP BY name
            ORDER BY SUM(total_time) DESC
            """,
            str(user.id),
        )

        # Get the user's current activities (if any)
        current_activities = [
            f"**•** `{activity}` - <t:{int(bot.activity_sessions.get(user.id)[activity]['time'])}:R>"
            for activity in bot.activity_sessions.get(user.id, [])
        ] or ["*No active activities.*"]

        pages = []

        # Configuration
        lines_per_page = 12
        lines_for_current_activity = (
            len(current_activities) + 3
        )  # +3 (2 titles & 1 spacing line)
        lines_for_past_activity = lines_per_page - lines_for_current_activity

        # Create the first page with current and past activities
        embed = discord.Embed(
            title=f"{user.name}'s Activity",
            color=discord.Color.purple(),
        )

        description = f"**Current activities:**\n{'\n'.join(current_activities)}\n\n**All activities:**\n"

        # Add past activities to the description, limited to the first page
        if past_activities:
            description += "\n".join(
                [
                    f"**•** `{activity[0]}` - {format_time(activity[1])} - <t:{int(activity[2])}:R>"
                    for activity in past_activities[:lines_for_past_activity]
                ]
            )
        else:
            description += "*No activities tracked.*"

        embed.description = description
        pages.append(embed)

        # Create additional pages for remaining past activities, if necessary
        remaining_past_activities = past_activities[lines_for_past_activity:]
        for i in range(0, len(remaining_past_activities), lines_per_page):
            activities_chunk = remaining_past_activities[i : i + lines_per_page]

            embed = discord.Embed(
                title=f"{user.name}'s Activity",
                color=discord.Color.purple(),
                description="\n".join(
                    f"**•** `{activity[0]}` - {format_time(activity[1])} - <t:{int(activity[2])}:R>"
                    for activity in activities_chunk
                ),
            )

            pages.append(embed)

        return pages

    except Exception as e:
        print(f"An error occurred while creating activity pages for the user: {e}")

        error_embed = discord.Embed(
            title="Error",
            color=discord.Color.red(),
            description="An error occurred while fetching the activity stats. Please try again later.",
        )

        return [error_embed]
