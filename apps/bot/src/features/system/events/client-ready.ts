import path from "node:path"
import { pathToFileURL } from "node:url"
import { type Client, Collection, Events } from "discord.js"
import glob from "fast-glob"
import { logger } from "@/core/logger"
import type { CommandModule } from "@/core/types/discord.js"
import { defineEvent } from "@/core/utils/define-event"

export const clientReadyListeners = [
   defineEvent(Events.ClientReady, {
      priority: 10,
      async execute(client: Client) {
         client.commands = new Collection<string, CommandModule>()

         const featuresDir = path.join(import.meta.dirname, "../..")
         const commandFiles = await glob("**/commands/**/*.{js,mjs,ts}", {
            cwd: featuresDir,
         })
         let total = 0

         for (const filePath of commandFiles) {
            const fullPath = path.resolve(featuresDir, filePath)
            const mod = await import(pathToFileURL(fullPath).href)
            const command: Partial<CommandModule> = mod

            if (!command.data || typeof command.execute !== "function") {
               logger.warn(
                  { filePath },
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
               { command: command.data.name, filePath },
               "Loaded command"
            )
         }

         logger.info({ count: total }, "Cached commands in client")

         if (!client.application) {
            logger.warn("client.application is undefined; skipping deployment")
         } else {
            const payload = client.commands.map((cmd) => cmd.data.toJSON())

            await client.application.commands.set(payload)

            logger.info(
               { count: payload.length },
               "Deployed slash commands to Discord"
            )
         }
      },
   }),

   defineEvent(Events.ClientReady, {
      priority: 100,
      execute(client: Client) {
         logger.info(
            {
               tag: client.user?.tag,
               id: client.user?.id,
               guilds: client.guilds.cache.size,
            },
            "Bot client ready"
         )
      },
   }),
]
