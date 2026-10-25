import { randomUUID } from "node:crypto"

export type PaginationIds = {
	sessionId: string
	first: string
	previous: string
	search: string
	next: string
	last: string
	modal: string
	input: string
}

export const PAGINATION_FEATURE = "pagination"

export function buildPaginationIds(): PaginationIds {
	const sessionId = randomUUID()
	const namespace = `${PAGINATION_FEATURE}:${sessionId}`

	return {
		sessionId,
		first: `${namespace}:first`,
		previous: `${namespace}:previous`,
		search: `${namespace}:search`,
		next: `${namespace}:next`,
		last: `${namespace}:last`,
		modal: `${namespace}:search-modal`,
		input: `${namespace}:search-input`,
	}
}
