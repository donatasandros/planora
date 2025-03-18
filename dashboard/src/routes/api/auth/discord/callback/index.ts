import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setCookie } from "@tanstack/react-start/server";
import axios from "axios";
import { eq } from "drizzle-orm";
import * as jose from "jose";

import { db } from "~/db";
import { usersTable } from "~/db/schemas";

export const APIRoute = createAPIFileRoute("/api/auth/discord/callback")({
  GET: async ({ request }) => {
    const code = new URL(request.url).searchParams.get("code");

    if (!code) {
      return new Response("No authentication code provided.", {
        status: 400,
      });
    }

    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID!);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET!);
    params.append("grant_type", "authorization_code");
    params.append("code", code.toString());
    params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI!);

    const response = await axios.post(
      "https://discord.com/api/v10/oauth2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Encoding": "application/x-www-form-urlencoded",
        },
      },
    );

    const userResponse = await axios.get(
      "https://discord.com/api/v10/users/@me",
      {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      },
    );

    const { id, username, avatar } = userResponse.data;

    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, String(id)),
    });

    if (existingUser) {
      await db
        .update(usersTable)
        .set({
          username,
          avatar,
        })
        .where(eq(usersTable.id, existingUser.id));
    } else {
      await db.insert(usersTable).values({
        id,
        username,
        avatar,
      });
    }

    const token = await new jose.SignJWT({ id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(jose.base64url.decode(process.env.JWT_SECRET!));

    setCookie("token", token);

    return Response.redirect("http://localhost:3000");
  },
});
