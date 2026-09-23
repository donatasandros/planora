import { type Client, type ClientEvents, Events } from "discord.js"
import { loadFeatureModules } from "@/core/handlers/load-feature-modules"
import { logger } from "@/core/logger"
import type { FeatureEventListener } from "@/core/types/event"

export default async function registerEvents(client: Client): Promise<void> {
   const modules = await loadFeatureModules("events")
   const eventRegistry = new Map<keyof ClientEvents, FeatureEventListener[]>()

   for (const { mod } of modules) {
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
      { totalEvents: eventRegistry.size, totalFiles: modules.length },
      "Registered event handlers"
   )
}
