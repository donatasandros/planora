import discord
from discord.ext import commands
from psycopg2 import pool

import settings


def run():
    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    intents.presences = True

    bot = commands.Bot(command_prefix="!", case_insensitive=True, intents=intents)

    connection_pool = pool.SimpleConnectionPool(
        1,  # Minimum number of connections in the pool
        10,  # Maximum number of connections in the pool
        settings.DATABASE_URL,
    )

    if connection_pool:
        print("Connection pool created successfully.")

    bot.db = connection_pool

    conn = connection_pool.getconn()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users")
    users = cur.fetchall()

    cur.close()
    connection_pool.putconn(conn)

    activity_sessions = {user[0]: {} for user in users}

    bot.activity_sessions = activity_sessions

    @bot.event
    async def on_ready():
        print(f"Bot is online. Logged in as {bot.user.name}.")

        for cog_file in settings.COGS_DIR.glob("*.py"):
            if cog_file.name != "__init.py":
                await bot.load_extension(f"cogs.{cog_file.name[:-3]}")

    bot.run(settings.BOT_TOKEN)


if __name__ == "__main__":
    run()
