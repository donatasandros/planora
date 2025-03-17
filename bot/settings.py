import os
import pathlib

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = pathlib.Path(__file__).parent

COMMANDS_DIR = BASE_DIR / "commands"
COGS_DIR = BASE_DIR / "cogs"

BOT_TOKEN = os.getenv("BOT_TOKEN")

DEV_USER_ID = os.getenv("DEV_USER_ID")
DEV_GUILD_ID = os.getenv("DEV_GUILD_ID")

DATABASE_URL = os.getenv("DATABASE_URL")
