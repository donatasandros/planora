export const COMMAND_COOLDOWN_PREFIX = "bot:cmd"

type ClaimFn = (key: string, ttlSeconds: number) => Promise<boolean>

export function getCooldownKey(commandName: string, userId: string): string {
	return `${COMMAND_COOLDOWN_PREFIX}:${commandName}:${userId}`
}

export async function isOnCooldown({
	commandName,
	userId,
	cooldownSeconds,
	claim,
}: {
	commandName: string
	userId: string
	cooldownSeconds: number
	claim: ClaimFn
}): Promise<boolean> {
	if (cooldownSeconds <= 0) {
		return false
	}

	const claimed = await claim(
		getCooldownKey(commandName, userId),
		cooldownSeconds
	)

	return !claimed
}
