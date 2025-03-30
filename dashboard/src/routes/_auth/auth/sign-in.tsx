import { createFileRoute } from "@tanstack/react-router";
import { FaDiscord } from "react-icons/fa6";

import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/_auth/auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  async function handleSignIn() {
    await authClient.signIn.social({ provider: "discord" });
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
          Welcome back
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to access your activity insights.
        </p>
      </div>
      <div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleSignIn}
          className="w-full [&_svg]:size-5.5"
        >
          <FaDiscord />
          Sign in with Discord
        </Button>
      </div>
    </div>
  );
}
