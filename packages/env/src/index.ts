import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace"])
			.default("info"),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		REDIS_URL: z.url(),
		DISCORD_BOT_TOKEN: z.string().trim().min(1),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
})
