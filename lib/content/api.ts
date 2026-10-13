import "server-only";

import { cache } from "react";

import { formatMediaUrl } from "@/lib/media/media-url";
import { SeoFetchError, seoFetch } from "@/lib/seo/api";
import { withPublicOrigin } from "@/lib/seo/public";
import type { ResolvedSeo } from "@/lib/seo/types";

const CONTENT_TAG = "seo";
const CONTENT_REVALIDATE_SECONDS = 3600;

export type ProjectCard = {
  id: number;
  title: string;
  slug: string;
  path: string;
  summary: string;
  cover_url: string | null;
  tags: string[];
  stack: string[];
  client: string | null;
  year: number | null;
  live_url: string | null;
  source_url: string | null;
  featured: boolean;
  published_at: string | null;
  updated_at: string | null;
};

export type ProjectDetail = ProjectCard & { body: string; seo: ResolvedSeo };

export type PostCard = {
  id: number;
  title: string;
  slug: string;
  path: string;
  excerpt: string;
  cover_url: string | null;
  author: string | null;
  category: string | null;
  tags: string[];
  reading_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
};

export type PostDetail = PostCard & { body: string; seo: ResolvedSeo };

type Body<T> = { data?: T };

/**
 * Public content is cached under the `seo` tag, which the API revalidates on
 * every project, post or SEO change. Lists fall back to empty when the API is
 * down so pages still render; details return null only for a real 404.
 */
async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await seoFetch(path, {
      next: { tags: [CONTENT_TAG], revalidate: CONTENT_REVALIDATE_SECONDS },
    });
    return ((await response.json()) as Body<T>).data ?? null;
  } catch (error) {
    if (error instanceof SeoFetchError && error.status === 404) return null;
    if (process.env.NODE_ENV !== "production") console.warn("[content] request failed", path, error);
    throw error;
  }
}

function withCover<T extends { cover_url: string | null }>(item: T): T {
  return { ...item, cover_url: formatMediaUrl(item.cover_url) };
}

export async function fetchProjects(options: { featured?: boolean; perPage?: number } = {}): Promise<ProjectCard[]> {
  const query = new URLSearchParams({ per_page: String(options.perPage ?? 50) });
  if (options.featured) query.set("featured", "1");

  try {
    const data = await get<{ projects: ProjectCard[] }>(`/projects?${query}`);
    return (data?.projects ?? []).map(withCover);
  } catch {
    return [];
  }
}

/** Memoized per request: `generateMetadata` and the page both read it. */
export const fetchProject = cache(async (slug: string): Promise<ProjectDetail | null> => {
  const data = await get<{ project: ProjectDetail }>(`/projects/${encodeURIComponent(slug)}`);
  return data?.project ? withCover({ ...data.project, seo: withPublicOrigin(data.project.seo) }) : null;
});

export async function fetchPosts(options: { perPage?: number } = {}): Promise<PostCard[]> {
  const query = new URLSearchParams({ per_page: String(options.perPage ?? 50) });

  try {
    const data = await get<{ posts: PostCard[] }>(`/posts?${query}`);
    return (data?.posts ?? []).map(withCover);
  } catch {
    return [];
  }
}

/** Memoized per request: `generateMetadata` and the page both read it. */
export const fetchPost = cache(async (slug: string): Promise<PostDetail | null> => {
  const data = await get<{ post: PostDetail }>(`/posts/${encodeURIComponent(slug)}`);
  return data?.post ? withCover({ ...data.post, seo: withPublicOrigin(data.post.seo) }) : null;
});
