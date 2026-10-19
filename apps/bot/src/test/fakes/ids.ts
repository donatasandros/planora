export function collectCustomIds(value: unknown): string[] {
	const found: string[] = []

	const walk = (node: unknown): void => {
		if (!node || typeof node !== "object") {
			return
		}

		const record = node as Record<string, unknown>

		if (typeof record.custom_id === "string") {
			found.push(record.custom_id)
		}

		for (const child of Object.values(record)) {
			walk(child)
		}
	}

	const withToJson = value as { toJSON?: () => unknown }

	walk(typeof withToJson?.toJSON === "function" ? withToJson.toJSON() : value)

	return found
}
