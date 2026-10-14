/**
 * Optional-feature toggles for this starter template.
 *
 * Every module here has a matching optional block in Laravel's
 * `config/modules.php`. Keep the two in sync: disabling a module on the
 * Next.js side only hides its admin UI; disable it on the API side too if
 * you also want its routes/queues/scheduled jobs to stop running.
 *
 * These read `NEXT_PUBLIC_*` env vars so the same values are available in
 * both server and client bundles (Next.js inlines `NEXT_PUBLIC_*` at build
 * time). Unset means enabled — opt out per module, not in.
 */

function isEnabled(value: string | undefined): boolean {
  return value !== "false" && value !== "0";
}

export const modules = {
  /** Media library + HLS video upload/transcoding admin screens. */
  media: isEnabled(process.env.NEXT_PUBLIC_MODULE_MEDIA),
  /** Database backup admin screen and status widgets. */
  backups: isEnabled(process.env.NEXT_PUBLIC_MODULE_BACKUPS),
  /** SEO health scanning admin screens. */
  seoHealth: isEnabled(process.env.NEXT_PUBLIC_MODULE_SEO_HEALTH),
  /** Audit log admin screens. */
  audit: isEnabled(process.env.NEXT_PUBLIC_MODULE_AUDIT),
  /** Realtime/Reverb diagnostics admin screen. */
  realtime: isEnabled(process.env.NEXT_PUBLIC_MODULE_REALTIME),
} as const;

export type ModuleName = keyof typeof modules;
