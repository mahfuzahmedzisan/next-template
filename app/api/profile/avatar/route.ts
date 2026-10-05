import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession, updateSession } from "@/lib/auth/auth-cookies";
import { deleteAvatar, uploadAvatar } from "@/lib/auth/profile";

async function requireSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 },
      ),
    };
  }

  return { session, response: null };
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status || 500 },
    );
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session || response) return response;

  const incoming = await request.formData();
  const file = incoming.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { message: "Choose an image file." },
      { status: 422 },
    );
  }

  try {
    const result = await uploadAvatar(file, file.name || "avatar.webp");
    await updateSession({ ...session, user: result.user });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");

    return NextResponse.json({
      message: "Avatar updated successfully.",
      user: result.user,
    });
  } catch (error) {
    return errorResponse(error, "Unable to upload avatar.");
  }
}

export async function DELETE() {
  const { session, response } = await requireSession();
  if (!session || response) return response;

  try {
    const result = await deleteAvatar();
    await updateSession({ ...session, user: result.user });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");

    return NextResponse.json({
      message: "Avatar removed successfully.",
      user: result.user,
    });
  } catch (error) {
    return errorResponse(error, "Unable to remove avatar.");
  }
}
