import { Client, GatewayIntentBits } from "discord.js"
import "dotenv/config"

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once("ready", (readyClient) => {
  console.log(`Bot logged in as ${readyClient.user.tag}`)
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!!")
  }
})

client.login(process.env.TOKEN)
