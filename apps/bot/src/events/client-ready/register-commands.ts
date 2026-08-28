import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  type Client,
  Collection,
  type CommandInteraction,
  type SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/lib/logger"

export interface CommandModule {
  data: SlashCommandBuilder
  execute: (client: Client, interaction: CommandInteraction) => Promise<void>
}

export default async function registerCommands(client: Client) {
  client.commands = new Collection<string, CommandModule>()

  const commandsRoot = path.join(import.meta.dirname, "..", "..", "commands")

  if (!fs.existsSync(commandsRoot)) {
    logger.warn({ commandsRoot }, "Commands root directory missing")
    return
  }

  const groups = fs
    .readdirSync(commandsRoot, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)
    .sort((a, b) => a.localeCompare(b))

  let total = 0

  for (const group of groups) {
    const groupPath = path.join(commandsRoot, group)
    const files = fs
      .readdirSync(groupPath)
      .filter(
        (f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".mjs")
      )
      .sort((a, b) => a.localeCompare(b))

    for (const file of files) {
      const filePath = path.join(groupPath, file)
      const mod = await import(pathToFileURL(filePath).href)

      const command: Partial<CommandModule> = mod.default ?? mod

      if (!command.data || typeof command.execute !== "function") {
        logger.warn(
          { group, file },
          "Skipping command file: missing 'data' or 'execute' export"
        )
        continue
      }

      client.commands.set(command.data.name, {
        data: command.data,
        execute: command.execute,
      })

      total++
      logger.debug(
        { command: command.data.name, group, file },
        "Loaded command"
      )
    }
  }

  logger.info({ count: total }, "Cached commands in client")

  // bulk overwrite to Discord
  if (!client.application) {
    logger.warn("client.application is undefined; skipping deployment")
  } else {
    const payload = client.commands.map((cmd) => cmd.data.toJSON())
    await client.application.commands.set(payload)
    logger.info({ count: payload.length }, "Deployed slash commands to Discord")
  }
}
