import discord
from discord import app_commands
from discord.ext import commands

from utils.paginator import PaginationView
from utils.summary_pages import create_summary_pages


class Summary(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    group = app_commands.Group(name="summary", description="View activity summaries.")

    @group.command(
        name="daily", description="Get a summary of today's tracked activity."
    )
    async def daily(
        self, interaction: discord.Interaction, user: discord.Member = None
    ):
        try:
            await interaction.response.defer()

            # Use the author of the interaction if no user is provided
            user = user or interaction.user
            user = interaction.guild.get_member(user.id)

            if user is None:
                await interaction.followup.send("Couldn't find the user in this guild.")
                return

            pages = await create_summary_pages(self.bot, user, "daily")

            pagination_view = PaginationView(pages)
            await pagination_view.send(interaction)

        except Exception as e:
            print(f"[ERROR] An error occurred while fetching user's activity: {e}")
            await interaction.followup.send(
                "An error occurred while fetching the activity stats. Please try again later."
            )

    @group.command(
        name="weekly", description="Get a summary of the last 7 days' activity."
    )
    async def weekly(
        self, interaction: discord.Interaction, user: discord.Member = None
    ):
        try:
            await interaction.response.defer()

            # Use the author of the interaction if no user is provided
            user = user or interaction.user
            user = interaction.guild.get_member(user.id)

            if user is None:
                await interaction.followup.send("Couldn't find the user in this guild.")
                return

            pages = await create_summary_pages(self.bot, user, "weekly")

            pagination_view = PaginationView(pages)
            await pagination_view.send(interaction)

        except Exception as e:
            print(
                f"[ERROR] An error occurred while fetching user's activity summary: {e}"
            )
            await interaction.followup.send(
                "An error occurred while fetching the summary. Please try again later."
            )


async def setup(bot):
    await bot.add_cog(Summary(bot))
