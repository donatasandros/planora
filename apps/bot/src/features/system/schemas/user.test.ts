import { describe, expect, it } from "vitest"
import { parseUser } from "@/features/system/schemas/user"

const validUser = {
	id: "42",
	isTrackingEnabled: true,
	isProfilePrivate: false,
	isBlacklisted: false,
}

describe("parseUser", () => {
	it("accepts a complete payload", () => {
		expect(parseUser(validUser)).toEqual(validUser)
	})

	it("rejects a payload missing a field", () => {
		expect(
			parseUser({
				id: "42",
				isTrackingEnabled: true,
				isProfilePrivate: false,
			})
		).toBeNull()
	})

	it("rejects a field with the wrong type", () => {
		expect(parseUser({ ...validUser, isBlacklisted: "false" })).toBeNull()
	})

	it("rejects a non-string id", () => {
		expect(parseUser({ ...validUser, id: 42 })).toBeNull()
	})

	it("strips unknown keys", () => {
		expect(parseUser({ ...validUser, staleField: "x" })).toEqual(validUser)
	})

	it.each([null, undefined, "42", 42, []])(
		"rejects the non-user value %s",
		(value) => {
			expect(parseUser(value)).toBeNull()
		}
	)
})
