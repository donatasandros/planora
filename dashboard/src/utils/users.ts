import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import * as jose from "jose";

import { db } from "~/db";
import { usersTable } from "~/db/schemas";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = getCookie("token");

    if (!token) {
      return null;
    }

    try {
      const {
        payload: { id },
      } = await jose.jwtVerify(
        token,
        jose.base64url.decode(process.env.JWT_SECRET!),
      );

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, String(id)),
      });

      return user || null;
    } catch (error) {
      return null;
    }
  },
);
