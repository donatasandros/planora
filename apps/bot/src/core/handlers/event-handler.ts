import path from "node:path"
import { pathToFileURL } from "node:url"
import { type Client, type ClientEvents, Events } from "discord.js"
import glob from "fast-glob"
import { logger } from "@/core/logger"
import type { FeatureEventListener } from "@/core/types/event"

export default async function registerEvents(client: Client): Promise<void> {
   const featuresDir = path.join(import.meta.dirname, "../../features")
   const eventFiles = await glob("**/events/**/*.{js,mjs,ts}", {
      cwd: featuresDir,
   })
   const eventRegistry = new Map<keyof ClientEvents, FeatureEventListener[]>()

   for (const filePath of eventFiles) {
      const fullPath = path.resolve(featuresDir, filePath)
      const mod = await import(pathToFileURL(fullPath).href)
      const exports = Object.values(mod).flat()

      for (const item of exports) {
         const rawItem = item as Record<string, unknown>

         if (
            !rawItem ||
            typeof rawItem !== "object" ||
            !rawItem.event ||
            typeof rawItem.execute !== "function"
         ) {
            continue
         }

         const listener = item as FeatureEventListener
         const existing = eventRegistry.get(listener.event) ?? []

         existing.push(listener)
         eventRegistry.set(listener.event, existing)
      }
   }

   for (const [eventName, listeners] of eventRegistry.entries()) {
      listeners.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50))

      const listenMethod = eventName === Events.ClientReady ? "once" : "on"

      client[listenMethod](eventName, async (...args: unknown[]) => {
         for (const listener of listeners) {
            try {
               const executable = listener.execute as unknown as (
                  c: Client,
                  ...a: unknown[]
               ) => Promise<boolean | undefined> | boolean | undefined
               const result = await executable(client, ...args)

               if (result === false) {
                  break
               }
            } catch (err) {
               logger.error(
                  { err, event: eventName },
                  "Feature event handler execution failed"
               )
            }
         }
      })
   }

   logger.info(
      { totalEvents: eventRegistry.size, totalFiles: eventFiles.length },
      "Registered event handlers"
   )
}
