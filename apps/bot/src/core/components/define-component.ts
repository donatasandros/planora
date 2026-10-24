import type { ComponentInstance } from "@/core/components/types"

type ButtonDefinition = Omit<ComponentInstance, "kind" | "onModal">
type ModalDefinition = Omit<ComponentInstance, "kind" | "onButton">

export function defineButton(instance: ButtonDefinition): ComponentInstance {
	return {
		...instance,
		kind: "button",
	}
}

export function defineModal(instance: ModalDefinition): ComponentInstance {
	return {
		...instance,
		kind: "modal",
	}
}
