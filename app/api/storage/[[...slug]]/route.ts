import { proxyStorage } from "@/lib/media/proxy-upstream";

export const dynamic = "force-dynamic";

async function forward(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await context.params;
  return proxyStorage(request, slug);
}

export const GET = forward;
export const HEAD = forward;
