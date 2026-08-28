import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { type Client, type ClientEvents, Events } from "discord.js"
import { kebabToCamel } from "@/helpers/string"
import { logger } from "@/lib/logger"

type EventKey = keyof ClientEvents
type HandlerFn<K extends EventKey = EventKey> = (
  client: Client,
  ...args: ClientEvents[K]
) => Promise<void> | void

export default async function registerEvents(client: Client) {
  const eventsRoot = path.join(import.meta.dirname, "..", "events")

  if (!fs.existsSync(eventsRoot)) {
    logger.warn({ eventsRoot }, "Events root directory missing")
    return
  }

  const eventFolders = fs
    .readdirSync(eventsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b))

  for (const folder of eventFolders) {
    const folderPath = path.join(eventsRoot, folder)

    const files = fs
      .readdirSync(folderPath)
      .filter(
        (f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".mjs")
      )
      .sort((a, b) => a.localeCompare(b))

    const handlers: HandlerFn[] = []

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const mod = await import(pathToFileURL(filePath).href)
      const handler = mod.default

      if (typeof handler !== "function") {
        throw new Error(
          `Event handler "${file}" in "${folder}" missing default function export.`
        )
      }

      handlers.push(handler)
    }

    logger.debug({ folder, count: handlers.length }, "Loaded event handlers")

    const eventName = kebabToCamel(folder) as EventKey
    const listenMethod = eventName === Events.ClientReady ? "once" : "on"

    client[listenMethod](eventName, (...args) => {
      void Promise.allSettled(
        handlers.map((fn) =>
          Promise.resolve(fn(client, ...args)).catch((err) =>
            logger.error(
              { err, event: eventName, folder },
              "Event handler execution failed"
            )
          )
        )
      )
    })
  }

  logger.info(
    { count: eventFolders.length },
    "Registered event handler categories"
  )
}
