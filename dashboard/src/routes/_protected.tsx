import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { MainNav } from "~/features/dashboard/components/main-nav";
import { MobileNav } from "~/features/dashboard/components/mobile-nav";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in" });
    } else {
      return { user: context.user };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <MainNav />
      <MobileNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
