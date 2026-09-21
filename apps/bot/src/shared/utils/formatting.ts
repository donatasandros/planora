import { discordTimestamp } from "@/shared/utils/discord"
import { formatTime } from "@/shared/utils/time"

export function escapeMarkdown(value: string): string {
   return value
      .replaceAll("\\", "\\\\")
      .replaceAll("`", "\\`")
      .replaceAll("*", "\\*")
      .replaceAll("_", "\\_")
}

export function formatActivityRow(
   activityName: string,
   timestamp: number | null,
   duration?: number | null
): string {
   const name = `\`${escapeMarkdown(activityName)}\``
   const time = duration ? `- ${formatTime(duration)}` : ""
   const date = timestamp ? `- ${discordTimestamp(timestamp)}` : "- Unknown"

   return `**•** ${name} ${time} ${date}`
}
