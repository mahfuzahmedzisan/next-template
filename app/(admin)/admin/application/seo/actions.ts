"use server";

import { revalidatePath, updateTag } from "next/cache";

import { toResult } from "@/lib/actions/result";
import {
  createSeoPage,
  deleteSeoPage,
  getSeoOverview,
  probeSeoPage,
  regenerateSeoFiles,
  saveSeoSettings,
  saveSeoTypeDefaults,
  updateSeoPage,
} from "@/lib/admin/seo";
import type {
  SeoFileEntry,
  SeoFileName,
  SeoOverview,
  SeoPageEntry,
  SeoPageInput,
  SeoSettingsInput,
  SeoTypeTemplate,
} from "@/lib/admin/seo-types";
import { ApiError } from "@/lib/auth/api-error";

const SEO_PATH = "/admin/application/seo";

type Failure = { ok: false; message: string; errors?: Record<string, string[]> };

export type SeoOverviewResult = { ok: true; message: string; overview: SeoOverview } | Failure;
export type SeoPageResult = { ok: true; message: string; page: SeoPageEntry } | Failure;
export type SeoFilesResult = { ok: true; message: string; files: SeoFileEntry[] } | Failure;

function fail(error: unknown, fallback: string): Failure {
  const result = toResult(error, fallback) as Failure;
  const body = error instanceof ApiError ? (error.body as { errors?: Record<string, string[]> } | undefined) : undefined;
  return body?.errors ? { ...result, errors: body.errors } : result;
}

/** Public pages read SEO through the `seo` cache tag; drop it so the next visit is fresh. */
function refresh() {
  updateTag("seo");
  revalidatePath(SEO_PATH);
}

export async function loadSeoOverviewAction(): Promise<SeoOverviewResult> {
  try {
    return { ok: true, message: "", overview: await getSeoOverview() };
  } catch (error) {
    return fail(error, "Unable to load SEO settings.");
  }
}

export async function saveSeoSettingsAction(input: SeoSettingsInput): Promise<SeoOverviewResult> {
  try {
    const overview = await saveSeoSettings(input);
    refresh();
    return { ok: true, message: "SEO settings saved.", overview };
  } catch (error) {
    return fail(error, "Unable to save SEO settings.");
  }
}

export async function saveSeoPageAction(id: number | null, input: SeoPageInput): Promise<SeoPageResult> {
  try {
    const page = id === null ? await createSeoPage(input) : await updateSeoPage(id, input);
    refresh();
    return { ok: true, message: id === null ? "Page added." : "Page SEO saved.", page };
  } catch (error) {
    return fail(error, "Unable to save this page.");
  }
}

export async function deleteSeoPageAction(id: number): Promise<SeoOverviewResult> {
  try {
    const overview = await deleteSeoPage(id);
    refresh();
    return { ok: true, message: "Page removed.", overview };
  } catch (error) {
    return fail(error, "Unable to remove this page.");
  }
}

export async function probeSeoPageAction(id: number): Promise<SeoPageResult> {
  try {
    return { ok: true, message: "Check queued.", page: await probeSeoPage(id) };
  } catch (error) {
    return fail(error, "Unable to queue the check.");
  }
}

export async function saveSeoTypeAction(type: string, template: SeoTypeTemplate): Promise<SeoOverviewResult> {
  try {
    const overview = await saveSeoTypeDefaults(type, template);
    refresh();
    return { ok: true, message: "Content-type defaults saved.", overview };
  } catch (error) {
    return fail(error, "Unable to save content-type defaults.");
  }
}

export async function regenerateSeoFilesAction(file: SeoFileName | "all"): Promise<SeoFilesResult> {
  try {
    const files = await regenerateSeoFiles(file);
    return { ok: true, message: file === "all" ? "SEO files regenerated." : "File regenerated.", files };
  } catch (error) {
    return fail(error, "Unable to regenerate.");
  }
}
