import { describe, expect, it } from "vitest"
import { splitIntoChunks } from "@/shared/utils/array"

describe("splitIntoChunks", () => {
	it("splits evenly", () => {
		expect(splitIntoChunks([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4],
		])
	})

	it("puts the remainder in a final short chunk", () => {
		expect(splitIntoChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
	})

	it("returns a single chunk when the size exceeds the length", () => {
		expect(splitIntoChunks([1, 2], 5)).toEqual([[1, 2]])
	})

	it("returns no chunks for an empty list", () => {
		expect(splitIntoChunks([], 5)).toEqual([])
	})

	it("throws for a non-positive chunk size", () => {
		expect(() => splitIntoChunks([1, 2, 3], 0)).toThrow(
			"chunkSize must be greater than zero"
		)
		expect(() => splitIntoChunks([1, 2, 3], -1)).toThrow()
	})
})
