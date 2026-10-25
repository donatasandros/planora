import { describe, expect, it } from "vitest"
import {
	buildActivityPages,
	buildHistoryPage,
} from "@/features/activity/reporting/pages"
import type {
	ActivityTotal,
	CurrentActivity,
	HistorySession,
} from "@/features/activity/types"
import { ACTIVITY_EMBED_ROWS } from "@/shared/constants/pagination"

function makeTotal(name: string, index: number): ActivityTotal {
	return {
		activityName: name,
		timePlayed: 3_600 + index,
		lastPlayed: 1_700_000_000 + index,
	}
}

function makeCurrent(name: string): CurrentActivity {
	return {
		activityName: name,
		startedAt: 1_700_000_000,
	}
}

function makeSession(name: string, index: number): HistorySession {
	return {
		id: `session-${index}`,
		activityName: name,
		activityKey: `0::${name}`,
		startedAt: 1_700_000_000 + index,
		endedAt: 1_700_000_100 + index,
		durationSeconds: 100,
		isCustom: false,
	}
}

describe("buildActivityPages", () => {
	it("fills the first page after the totals and current activities", () => {
		const pastActivities = Array.from({ length: 8 }, (_, index) =>
			makeTotal(`Activity ${index + 1}`, index)
		)
		const currentActivities = [makeCurrent("Current activity")]

		const pages = buildActivityPages(
			"user",
			pastActivities,
			currentActivities
		)

		const firstPageRows = ACTIVITY_EMBED_ROWS - 6

		expect(pages.embeds).toHaveLength(2)
		expect(pages.searchTerms).toEqual([
			pastActivities
				.slice(0, firstPageRows)
				.map((activity) => activity.activityName)
				.join(" "),
			pastActivities
				.slice(firstPageRows)
				.map((activity) => activity.activityName)
				.join(" "),
		])
		expect(pages.embeds[0]?.description).toContain("Current activities:")
		expect(pages.embeds[0]?.description).toContain("All activities:")
		expect(pages.embeds.map((embed) => embed.footer?.text)).toEqual([
			"Page 1 / 2",
			"Page 2 / 2",
		])
	})

	it("numbers every page when there are multiple pages", () => {
		const pastActivities = Array.from({ length: 30 }, (_, index) =>
			makeTotal(`Activity ${index + 1}`, index)
		)

		const pages = buildActivityPages("user", pastActivities, [])

		expect(pages.embeds.map((embed) => embed.footer?.text)).toEqual([
			"Page 1 / 3",
			"Page 2 / 3",
			"Page 3 / 3",
		])
	})

	it("uses the full row budget when there are no current activities", () => {
		const pastActivities = Array.from({ length: 30 }, (_, index) =>
			makeTotal(`Activity ${index + 1}`, index)
		)

		const pages = buildActivityPages("user", pastActivities, [])

		expect(pages.embeds).toHaveLength(3)
		expect(pages.searchTerms).toHaveLength(3)
		expect(pages.embeds[0]?.description).not.toContain("[")
	})

	it("renders an empty state when there are no activities", () => {
		const pages = buildActivityPages("user", [], [])

		expect(pages.embeds).toHaveLength(1)
		expect(pages.embeds[0]?.description).toContain("*No activities tracked.*")
		expect(pages.embeds[0]?.footer).toBeUndefined()
		expect(pages.searchTerms).toEqual([""])
	})

	it("does not add a footer when there is only one page", () => {
		const pages = buildActivityPages("user", [makeTotal("Game", 0)], [])

		expect(pages.embeds).toHaveLength(1)
		expect(pages.embeds[0]?.footer).toBeUndefined()
	})
})

describe("buildHistoryPage", () => {
	it("renders sessions with the page footer", () => {
		const sessions = [makeSession("Game", 0), makeSession("Music", 1)]

		const page = buildHistoryPage("user", sessions, 1)

		expect(page.title).toBe("user's Activity History")
		expect(page.description).toContain("Game")
		expect(page.description).toContain("Music")
		expect(page.footer?.text).toBe("Page 2")
	})
})
