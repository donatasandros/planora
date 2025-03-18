from contextlib import suppress
from typing import List

import discord


class PaginationView(discord.ui.View):
    def __init__(self, pages: List[discord.Embed], timeout=180):
        super().__init__(timeout=timeout)
        self.pages = pages
        self.current_page = 0
        self.message: discord.Message | None = None
        self.update_buttons()

    async def interaction_check(self, interaction: discord.Interaction, /) -> bool:
        if (
            self.message
            and interaction.user.id == self.message.interaction_metadata.user.id
        ):
            return True
        await interaction.response.send_message(
            "You cannot interact with this pagination.", ephemeral=True
        )
        return False

    async def send(self, interaction: discord.Interaction):
        await interaction.followup.send(embed=self.pages[self.current_page], view=self)
        self.message = await interaction.original_response()

    def update_buttons(self):
        self.first_page_button.disabled = self.current_page == 0
        self.prev_button.disabled = self.current_page == 0
        self.next_button.disabled = self.current_page == len(self.pages) - 1
        self.last_page_button.disabled = self.current_page == len(self.pages) - 1

    @discord.ui.button(label="↤", style=discord.ButtonStyle.gray)
    async def first_page_button(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        self.current_page = 0
        self.update_buttons()
        await interaction.response.edit_message(
            embed=self.pages[self.current_page], view=self
        )

    @discord.ui.button(label="←", style=discord.ButtonStyle.gray)
    async def prev_button(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        self.current_page = max(0, self.current_page - 1)
        self.update_buttons()
        await interaction.response.edit_message(
            embed=self.pages[self.current_page], view=self
        )

    @discord.ui.button(label="→", style=discord.ButtonStyle.gray)
    async def next_button(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        self.current_page = min(len(self.pages) - 1, self.current_page + 1)
        self.update_buttons()
        await interaction.response.edit_message(
            embed=self.pages[self.current_page], view=self
        )

    @discord.ui.button(label="↦", style=discord.ButtonStyle.gray)
    async def last_page_button(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        self.current_page = len(self.pages) - 1
        self.update_buttons()
        await interaction.response.edit_message(
            embed=self.pages[self.current_page], view=self
        )

    @discord.ui.button(label="x", style=discord.ButtonStyle.danger)
    async def stop_button(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        for item in self.children:
            item.disabled = True
        self.stop()

        with suppress(Exception):
            await self.message.edit(view=self)

        await interaction.response.defer()

    async def on_timeout(self):
        for item in self.children:
            item.disabled = True
        self.stop()

        with suppress(Exception):
            await self.message.edit(view=self)
