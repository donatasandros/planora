import { env } from "@workspace/env"
import pino from "pino"

const logger = pino({
	level: env.LOG_LEVEL,
	...(env.NODE_ENV === "production"
		? {}
		: {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				},
			}),
	redact: {
		paths: [
			"token",
			"authorization",
			"password",
			"secret",
			"DISCORD_BOT_TOKEN",
			"DATABASE_URL",
			"REDIS_URL",
		],
		censor: "[REDACTED]",
	},
})

export function createChildLogger(serviceName: string) {
	return logger.child({ service: serviceName })
}
