import os

from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

DEV_USER_ID = os.getenv("DEV_USER_ID")
DEV_GUILD_ID = os.getenv("DEV_GUILD_ID")

DATABASE_URL = os.getenv("DATABASE_URL")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

EXTENSIONS = ["cogs.activity", "cogs.summary", "cogs.system", "cogs.events.events"]
