import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: Home,
});

function Home() {
  return <div>hello world!</div>;
}
