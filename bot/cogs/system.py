import discord
from discord import app_commands
from discord.ext import commands

import settings


class System(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(
        name="ping", description="Check the bot's latency to the Discord server."
    )
    async def ping(self, interaction: discord.Interaction):
        bot_latency = round(self.bot.latency * 1000)
        await interaction.response.send_message(f"Bot latency: {bot_latency} ms.")

    @app_commands.command(name="sync", description="Sync slash commands.")
    async def sync(self, interaction: discord.Interaction):

        await interaction.response.defer()

        if interaction.user.id == int(settings.DEV_USER_ID):
            try:
                self.bot.tree.copy_global_to(
                    guild=discord.Object(id=int(settings.DEV_GUILD_ID))
                )
                synced_commands = await self.bot.tree.sync(
                    guild=discord.Object(id=int(settings.DEV_GUILD_ID))
                )
                await interaction.followup.send(
                    f"Successfully synced {len(synced_commands)} slash command(s)!"
                )
            except Exception as e:
                print(f"[ERROR] An error occurred while syncing the commands: {e}")
        else:
            await interaction.followup.send(
                "You do not have permission to sync the commands."
            )


async def setup(bot):
    await bot.add_cog(System(bot))
