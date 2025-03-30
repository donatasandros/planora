import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { LOGO_SMALL_URL } from "~/constants";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-gray-50 md:px-8 md:py-24 dark:bg-gray-900">
      <div className="flex min-h-full w-full flex-col bg-white px-4 py-12 md:h-fit md:w-[440px] md:rounded-2xl md:px-10 md:py-8 md:shadow-sm dark:bg-gray-950">
        <div className="mx-auto mb-6">
          <img
            src={LOGO_SMALL_URL}
            alt="Planora logo"
            className="size-10 drop-shadow-sm md:size-12"
          />
        </div>
        <Outlet />
      </div>
    </main>
  );
}
