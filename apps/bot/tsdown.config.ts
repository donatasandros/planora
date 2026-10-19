import { defineConfig } from "tsdown"

export default defineConfig({
	entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/test/**"],
	format: "esm",
	clean: true,
})
