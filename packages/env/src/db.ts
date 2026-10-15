import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
})
