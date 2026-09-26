type TimeUnit = "hours" | "minutes" | "seconds"

const TIME_UNITS = [
	{
		key: "hours",
		divisor: 3600,
		label: "h",
	},
	{
		key: "minutes",
		divisor: 60,
		label: "m",
	},
	{
		key: "seconds",
		divisor: 1,
		label: "s",
	},
] as const

/**
 * Formats a duration in seconds as a compact human-readable string.
 *
 * `units` is a set, not a sequence: requested units are always rendered
 * largest-first regardless of the order they are passed in, because each unit
 * consumes the remainder left by the larger one before it. `["minutes", "hours"]`
 * therefore produces the same output as `["hours", "minutes"]`.
 *
 * @param units Units to include. Defaults to all three. Duplicates are ignored.
 * An empty list falls back to `0 s`.
 */
export function formatTime(
	seconds: number,
	units: readonly TimeUnit[] = ["hours", "minutes", "seconds"]
): string {
	const selectedUnits = TIME_UNITS.filter(({ key }) => units.includes(key))
	let remaining = Math.max(0, Math.floor(seconds))

	const values = selectedUnits.map((unit) => {
		const value = Math.floor(remaining / unit.divisor)

		remaining %= unit.divisor

		return { label: unit.label, value }
	})

	const firstNonZero = values.findIndex(({ value }) => value > 0)
	const start = firstNonZero === -1 ? values.length - 1 : firstNonZero

	const parts = values
		.slice(start)
		.map(({ label, value }) => `${value} ${label}`)

	return parts.join(" ") || "0 s"
}
