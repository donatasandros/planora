import {
   activitySessionsTable,
   and,
   count,
   db,
   desc,
   eq,
   isNotNull,
   lt,
   or,
} from "@workspace/db"
import {
   type APIEmbed,
   type ChatInputCommandInteraction,
   type Client,
   EmbedBuilder,
   SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { COLORS } from "@/shared/constants/colors"
import { ITEMS_PER_PAGE } from "@/shared/constants/pagination"
import { formatActivityRow } from "@/shared/utils/formatting"
import type { PaginationCursor } from "@/shared/utils/pagination"
import paginate from "@/shared/utils/pagination"

type HistorySession = {
   id: string
   activityName: string
   activityKey: string
   startedAt: number
   endedAt: number | null
   durationSeconds: number
   isCustom: boolean
}

type HistoryPage = {
   sessions: HistorySession[]
   nextCursor: PaginationCursor | null
   totalPages?: number
}

export const data = new SlashCommandBuilder()
   .setName("history")
   .setDescription("View activity session history.")
   .addUserOption((option) =>
      option
         .setName("user")
         .setDescription("The user whose activity history you want to view")
         .setRequired(false)
   )

async function getHistoryPage(
   userId: string,
   cursor: PaginationCursor | null
): Promise<HistoryPage> {
   const userCondition = eq(activitySessionsTable.userId, userId)
   const completedCondition = isNotNull(activitySessionsTable.endedAt)
   const baseCondition = and(userCondition, completedCondition)

   const cursorCondition = cursor
      ? or(
           lt(activitySessionsTable.startedAt, cursor.startedAt),
           and(
              eq(activitySessionsTable.startedAt, cursor.startedAt),
              lt(activitySessionsTable.id, cursor.id)
           )
        )
      : undefined

   const whereCondition = cursorCondition
      ? and(baseCondition, cursorCondition)
      : baseCondition

   let totalPages: number | undefined

   if (!cursor) {
      const [result] = await db
         .select({
            total: count(),
         })
         .from(activitySessionsTable)
         .where(baseCondition)

      const totalSessions = Number(result?.total ?? 0)

      totalPages = Math.ceil(totalSessions / ITEMS_PER_PAGE)
   }

   const rows = await db
      .select({
         id: activitySessionsTable.id,
         activityName: activitySessionsTable.activityName,
         activityKey: activitySessionsTable.activityKey,
         startedAt: activitySessionsTable.startedAt,
         endedAt: activitySessionsTable.endedAt,
         durationSeconds: activitySessionsTable.durationSeconds,
         isCustom: activitySessionsTable.isCustom,
      })
      .from(activitySessionsTable)
      .where(whereCondition)
      .orderBy(
         desc(activitySessionsTable.startedAt),
         desc(activitySessionsTable.id)
      )
      .limit(ITEMS_PER_PAGE + 1)

   const hasNextPage = rows.length > ITEMS_PER_PAGE
   const sessions = rows.slice(0, ITEMS_PER_PAGE)
   const lastSession = sessions.at(-1)

   return {
      sessions,
      nextCursor:
         hasNextPage && lastSession
            ? {
                 startedAt: lastSession.startedAt,
                 id: lastSession.id,
              }
            : null,
      totalPages,
   }
}

function buildHistoryEmbed(
   username: string,
   sessions: HistorySession[],
   pageIndex: number,
   totalPages?: number
): APIEmbed {
   return new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(`${username}'s Activity History`)
      .setDescription(
         sessions
            .map((session) =>
               formatActivityRow(
                  session.activityName,
                  session.endedAt,
                  session.durationSeconds
               )
            )
            .join("\n")
      )
      .setFooter({
         text: `Page ${pageIndex + 1} / ${totalPages}`,
      })
      .toJSON()
}
export async function execute(
   _client: Client,
   interaction: ChatInputCommandInteraction
) {
   await interaction.deferReply()

   const user = interaction.options.getUser("user") ?? interaction.user

   try {
      await paginate<HistorySession>({
         mode: "cursor",
         interaction,
         loadPage: async (cursor) => {
            const page = await getHistoryPage(user.id, cursor)

            return {
               items: page.sessions,
               nextCursor: page.nextCursor,
               totalPages: page.totalPages,
            }
         },
         renderPage: (sessions, pageIndex, totalPages) =>
            buildHistoryEmbed(user.username, sessions, pageIndex, totalPages),
         emptyEmbed: new EmbedBuilder()
            .setColor(COLORS.primary)
            .setTitle(`${user.username}'s Activity History`)
            .setDescription("No completed activity sessions found.")
            .toJSON(),
      })
   } catch (err) {
      logger.error(
         {
            err,
            userId: user.id,
         },
         "Failed to load activity history"
      )

      await interaction.editReply({
         content: "Failed to load activity history.",
         embeds: [],
         components: [],
      })
   }
}
