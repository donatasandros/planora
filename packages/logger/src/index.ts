import { env } from "@workspace/env"
import pino from "pino"

const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
})

export function createChildLogger(serviceName: string) {
  return logger.child({ service: serviceName })
}
