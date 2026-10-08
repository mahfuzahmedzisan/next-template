import { getSession } from "@/lib/auth/auth-cookies";
import { proxyTus } from "@/lib/media/proxy-upstream";

export const dynamic = "force-dynamic";

async function forward(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { slug } = await context.params;
  return proxyTus(request, slug);
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const HEAD = forward;
export const DELETE = forward;
export const OPTIONS = forward;
