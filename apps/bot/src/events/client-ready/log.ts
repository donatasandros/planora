import type { Client } from "discord.js"
import { logger } from "@/lib/logger"

const onLogin = (client: Client) => {
  logger.info(
    {
      tag: client.user?.tag,
      id: client.user?.id,
      guilds: client.guilds.cache.size,
    },
    "Bot client ready"
  )
}

export default onLogin
