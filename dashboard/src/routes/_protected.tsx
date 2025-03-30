import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import { MainNav } from "~/features/dashboard/components/main-nav";
import { MobileNav } from "~/features/dashboard/components/mobile-nav";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({
        href: "https://discord.com/oauth2/authorize?client_id=1350462336237961246&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fdiscord%2Fcallback&scope=identify+email+connections",
      });
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
      <main className="relative mx-auto max-w-[1280px] pt-16 md:pt-[72px]">
        <Outlet />
      </main>
    </div>
  );
}
