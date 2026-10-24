import { randomUUID } from "node:crypto"

export type PaginationIds = {
	first: string
	previous: string
	search: string
	next: string
	last: string
	modal: string
	input: string
}

export function buildPaginationIds(): PaginationIds {
	const namespace = `pagination:${randomUUID()}`

	return {
		first: `${namespace}:first`,
		previous: `${namespace}:previous`,
		search: `${namespace}:search`,
		next: `${namespace}:next`,
		last: `${namespace}:last`,
		modal: `${namespace}:search-modal`,
		input: `${namespace}:search-input`,
	}
}
