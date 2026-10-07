export type ReverbPublicConfig = {
  key: string;
  host: string;
  port: number;
  scheme: string;
  useTls: boolean;
};

export function reverbPublicConfig(): ReverbPublicConfig {
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";

  return {
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "",
    host: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    port: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    scheme,
    useTls: scheme === "https",
  };
}

export function isReverbConfigured(): boolean {
  const config = reverbPublicConfig();
  return config.key !== "" && config.host !== "";
}
