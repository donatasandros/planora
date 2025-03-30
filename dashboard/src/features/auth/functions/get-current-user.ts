import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

import { auth } from "~/lib/auth";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();

    if (!request) {
      return null;
    }

    try {
      const authData = await auth.api.getSession({
        headers: request.headers,
      });

      const user = authData?.user || null;

      return user;
    } catch {
      return null;
    }
  },
);
