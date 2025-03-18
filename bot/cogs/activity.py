import discord
from discord import app_commands
from discord.ext import commands

from utils.activity_pages import create_activity_pages
from utils.paginator import PaginationView


class Activity(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="activity", description="View a user's activity stats.")
    async def activity(
        self,
        interaction: discord.Interaction,
        user: discord.Member = None,
    ):
        try:
            await interaction.response.defer()

            # Use the author of the interaction if no user is provided
            user = user or interaction.user
            user = interaction.guild.get_member(user.id)

            if user is None:
                await interaction.followup.send("Couldn't find the user in this guild.")
                return

            pages = await create_activity_pages(self.bot, user)

            pagination_view = PaginationView(pages)

            await pagination_view.send(interaction)

        except Exception as e:
            print(f"[ERROR] An error occurred while fetching user's activity: {e}")
            await interaction.followup.send(
                "An error occurred while fetching the activity stats. Please try again later."
            )


async def setup(bot):
    await bot.add_cog(Activity(bot))
