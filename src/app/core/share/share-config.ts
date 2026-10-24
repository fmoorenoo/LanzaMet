import { InjectionToken } from '@angular/core';

export interface ShareConfig {
  /**
   * The site's public address ("https://…"), the link every shared message
   * carries. Given at build time (`PUBLIC_URL`, see scripts/build-production.ts),
   * so a copy opened from another address (*.workers.dev) still shares the
   * real domain. Without it a deployed copy shares the address it is served
   * from, and a local one (localhost, a private network) shares no link at
   * all, never a made-up one.
   */
  readonly publicUrl: string | null;
}

declare const LM_PUBLIC_URL: string | undefined;

export const SHARE_CONFIG = new InjectionToken<ShareConfig>('SHARE_CONFIG', {
  factory: () => {
    const url = typeof LM_PUBLIC_URL === 'string' ? LM_PUBLIC_URL.trim() : '';
    return { publicUrl: /^https:\/\/[^/\s]+$/.test(url) ? url : null };
  },
});

/** Hosts nobody else can open: a link to them would lead nowhere. */
const LOCAL_HOST =
  /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\]|10(?:\.\d+){3}|192\.168(?:\.\d+){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d+){2}|.+\.local)$/i;

/** The link to share: the configured address, else this page's own if the public can reach it. */
export function shareLink(
  config: ShareConfig,
  location: Pick<Location, 'origin' | 'protocol' | 'hostname'> | null,
): string | null {
  if (config.publicUrl) return config.publicUrl;
  if (!location || !/^https?:$/.test(location.protocol)) return null;
  return LOCAL_HOST.test(location.hostname) ? null : location.origin;
}
