export type DiscordTimestampStyle = "t" | "T" | "d" | "D" | "f" | "F" | "R"

export function discordTimestamp(
   timestampSeconds: number,
   style: DiscordTimestampStyle = "R"
): string {
   return `<t:${timestampSeconds}:${style}>`
}
