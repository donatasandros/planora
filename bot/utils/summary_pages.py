import discord
from discord.ext import commands

from utils.time import format_time


async def create_summary_pages(bot: commands.Bot, user: discord.Member, type: str):
    """Creates paginated summary pages for a user based on given type ('daily' or 'weekly')."""

    try:
        # Determine the query and title based on summary type
        if type == "daily":
            query = """
                    SELECT name, SUM(total_time), MAX(end_time), DATE_TRUNC('day', TO_TIMESTAMP(start_time)) 
                    FROM activities
                    WHERE user_id = $1 AND TO_TIMESTAMP(start_time) >= NOW() - INTERVAL '1 day'
                    GROUP BY name, DATE_TRUNC('day', TO_TIMESTAMP(start_time))
                    ORDER BY DATE_TRUNC('day', TO_TIMESTAMP(start_time)) DESC, SUM(total_time) DESC;
                    """
            activity_title = "Today's activity:"
        elif type == "weekly":
            query = """
                    SELECT name, SUM(total_time), MAX(end_time)
                    FROM activities
                    WHERE user_id = $1 AND TO_TIMESTAMP(start_time) >= NOW() - INTERVAL '7 days'
                    GROUP BY name
                    ORDER BY SUM(total_time) DESC;
                    """
            activity_title = "This week's activity:"
        else:
            # Handle invalid summary type (must be 'daily' or 'weekly')
            error_embed = discord.Embed(
                title="Error",
                color=discord.Color.red(),
                description="Invalid summary type.  Must be 'daily' or 'weekly'.",
            )
            return [error_embed]

        # Get the user's past activities
        try:
            past_activities = await bot.db.fetch(query, str(user.id))
        except Exception as e:
            print(f"Error fetching activities from the database: {e}")
            error_embed = discord.Embed(
                title="Database Error",
                color=discord.Color.red(),
                description="An error occurred while fetching activity data from the database. Please try again later.",
            )
            return [error_embed]

        # Calculate total time spent across all activities
        total_past_time = sum(activity[1] for activity in past_activities)

        pages = []

        # Configuration
        lines_per_page = 12 - 2  # -2 (1 title & 1 spacing line)

        # Create the first page with total time and past activities
        embed = discord.Embed(
            title=f"{user.name}'s {type.capitalize()} Summary",
            color=discord.Color.purple(),
        )

        description = f"**Total time tracked:** {format_time(total_past_time)}\n\n**{activity_title}**\n"

        # Add past activities to the description, limited to the first page
        if past_activities:
            description += "\n".join(
                [
                    f"**•** `{activity[0]}` - {format_time(activity[1])} - <t:{int(activity[2])}:R>"
                    for activity in past_activities[:lines_per_page]
                ]
            )
        else:
            description += "*No activities tracked.*"

        embed.description = description
        pages.append(embed)

        # Create additional pages for remaining past activities, if necessary
        remaining_past_activities = past_activities[lines_per_page:]
        for i in range(0, len(remaining_past_activities), lines_per_page):
            activities_chunk = remaining_past_activities[i : i + lines_per_page]

            embed = discord.Embed(
                title=f"{user.name}'s {type.capitalize()} Summary",
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
