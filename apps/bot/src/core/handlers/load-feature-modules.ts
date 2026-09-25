import path from "node:path"
import { pathToFileURL } from "node:url"
import glob from "fast-glob"

const FEATURES_DIR = path.join(import.meta.dirname, "../../features")

type LoadedFeatureModule = {
	filePath: string
	mod: Record<string, unknown>
}

export async function loadFeatureModules(
	subdir: "commands" | "events"
): Promise<LoadedFeatureModule[]> {
	const files = await glob(`**/${subdir}/**/*.{js,mjs,ts}`, {
		cwd: FEATURES_DIR,
	})
	const modules: LoadedFeatureModule[] = []

	for (const filePath of files) {
		const fullPath = path.resolve(FEATURES_DIR, filePath)
		const mod = await import(pathToFileURL(fullPath).href)

		modules.push({ filePath, mod })
	}

	return modules
}
