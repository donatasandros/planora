import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/auth/sign-in"!</div>;
}
