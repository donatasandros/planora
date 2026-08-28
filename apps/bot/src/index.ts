import { Client, IntentsBitField, Partials } from "discord.js"
import eventHandler from "@/handlers/event-handler"
import { logger } from "@/lib/logger"

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

;(async () => {
  try {
    eventHandler(client)
    await client.login(process.env.TOKEN)
  } catch (err) {
    logger.error({ err }, "Fatal error during bot startup")
  }
})()
