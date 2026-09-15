import { env } from "@workspace/env"
import { Client, IntentsBitField, Partials } from "discord.js"
import eventHandler from "@/handlers/event-handler"
import { logger } from "@/lib/logger"
import { startSessionSweeperWorker } from "@/workers/activity-session-sweeper"

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
  ],
})

startSessionSweeperWorker()

;(async () => {
  try {
    await eventHandler(client)
    await client.login(env.DISCORD_BOT_TOKEN)
  } catch (err) {
    logger.error({ err }, "Fatal error during bot startup")
  }
})()
