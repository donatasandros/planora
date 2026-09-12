import type { Client } from "discord.js"
import { logger } from "@/lib/logger"

export default function handleLogin(client: Client): void {
  logger.info(
    {
      tag: client.user?.tag,
      id: client.user?.id,
      guilds: client.guilds.cache.size,
    },
    "Bot client ready"
  )
}
