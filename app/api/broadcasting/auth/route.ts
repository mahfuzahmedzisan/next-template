import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/auth-cookies";
import { laravelHttp, toApiError } from "@/lib/auth/http";

/**
 * Echo never sees the Sanctum bearer token. This route reads the httpOnly
 * session and forwards `socket_id` / `channel_name` to the API.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 422 });
  }

  try {
    const response = await laravelHttp.post("/broadcasting/auth", body, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    return NextResponse.json(response.data ?? { message: "Broadcast auth failed." }, {
      status: response.status,
    });
  } catch (error) {
    const apiError = toApiError(error, "Unable to reach the API.");
    return NextResponse.json(
      { message: apiError.message },
      { status: apiError.status },
    );
  }
}
