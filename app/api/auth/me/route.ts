import { NextResponse } from "next/server";
import { ApiError, fetchLaravelUser } from "@/lib/auth/api";
import {
  deleteSession,
  getSession,
  updateSession,
} from "@/lib/auth/auth-cookies";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const user = await fetchLaravelUser(session.accessToken);
    await updateSession({ ...session, user });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await deleteSession();
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    // Fall back to the cookie-cached user if Laravel is temporarily unreachable.
    return NextResponse.json({ user: session.user });
  }
}
