import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Footer } from "~/features/marketing/components/footer";
import { MainNav } from "~/features/marketing/components/main-nav";

export const Route = createFileRoute("/_marketing")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <MainNav />
      <main className="bg-white dark:bg-gray-950">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
