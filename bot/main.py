import asyncio

import discord
from discord.ext import commands

import settings
from lib.db import Database


async def run():
    db = await Database.connect()

    users = await db.fetch("SELECT * FROM users")
    activity_sessions = {user[0]: {} for user in users}

    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    intents.presences = True

    bot = commands.Bot(
        command_prefix="!",
        case_insensitive=True,
        activity=discord.Activity(
            type=discord.ActivityType.listening,
            name="the startup sequence",
        ),
        owner_id=settings.DEV_USER_ID,
        reconnect=True,
        intents=intents,
    )

    bot.db = db
    bot.activity_sessions = activity_sessions

    for extension in settings.EXTENSIONS:
        try:
            await bot.load_extension(extension)
            print(f"[EXTENSION] {extension} was loaded successfully.")
        except Exception as e:
            print(f"[ERROR] Couldn't load extension {extension}: {e}")

    try:
        await bot.start(settings.BOT_TOKEN)
        print("[BOT] Starting the bot.")
    except KeyboardInterrupt as e:
        print(f"[ERROR] An error occurred while booting up: {e}")
        await db.close()
        await bot.close()


if __name__ == "__main__":
    loop = asyncio.get_event_loop_policy().get_event_loop()
    loop.run_until_complete(run())
