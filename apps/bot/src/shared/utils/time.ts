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

export function formatTime(
	seconds: number,
	format: TimeUnit[] = ["hours", "minutes", "seconds"]
): string {
	const units = TIME_UNITS.filter((unit) => format.includes(unit.key))
	let remaining = Math.max(0, Math.floor(seconds))

	const values = units.map((unit) => {
		const value = Math.floor(remaining / unit.divisor)

		remaining %= unit.divisor

		return { key: unit.key, value }
	})

	const firstNonZero = values.findIndex((value) => value.value > 0)
	const start = firstNonZero === -1 ? values.length - 1 : firstNonZero

	const parts = units
		.slice(start)
		.map((unit, i) => `${values[start + i].value} ${unit.label}`)

	return parts.join(" ") || "0 s"
}
