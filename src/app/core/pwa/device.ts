/*
 * Which device and browser the visitor is on, only to tell them how to keep
 * the web at hand: each one installs it (or doesn't) in its own way. Read from
 * the user agent because nothing else says it; a wrong guess only shows the
 * wrong steps, and the guide lets the visitor pick their device.
 */

export type DeviceKind = 'ios' | 'android' | 'desktop';

export type Browser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'opera' | 'other';

export interface Device {
  readonly kind: DeviceKind;
  readonly browser: Browser;
  /** A Mac: bookmarks are Cmd + D instead of Ctrl + D. */
  readonly mac: boolean;
  /** Inside another app's browser (Instagram, Facebook…), which can't add anything to the home screen. */
  readonly inApp: boolean;
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|BytedanceWebview|musical_ly/;

export function detectDevice(userAgent: string, maxTouchPoints = 0): Device {
  const ua = userAgent;
  const mac = /Macintosh|Mac OS X/.test(ua);
  // iPadOS asks for desktop pages and calls itself a Mac; only the touch screen gives it away.
  const ios = /iPhone|iPad|iPod/.test(ua) || (mac && maxTouchPoints > 1);

  if (ios) {
    return { kind: 'ios', browser: iosBrowser(ua), mac: false, inApp: IN_APP.test(ua) };
  }
  if (/Android/.test(ua)) {
    // `; wv)` is Android's own WebView, the browser inside other apps.
    const inApp = IN_APP.test(ua) || /; wv\)/.test(ua);
    return { kind: 'android', browser: androidBrowser(ua), mac: false, inApp };
  }
  return { kind: 'desktop', browser: desktopBrowser(ua), mac, inApp: false };
}

function iosBrowser(ua: string): Browser {
  if (/CriOS/.test(ua)) return 'chrome';
  if (/EdgiOS/.test(ua)) return 'edge';
  if (/FxiOS/.test(ua)) return 'firefox';
  if (/OPT\//.test(ua)) return 'opera';
  return 'safari';
}

function androidBrowser(ua: string): Browser {
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/EdgA\//.test(ua)) return 'edge';
  if (/OPR\//.test(ua)) return 'opera';
  if (/Chrome\//.test(ua)) return 'chrome';
  return 'other';
}

// Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
function desktopBrowser(ua: string): Browser {
  if (/Edg\//.test(ua)) return 'edge';
  if (/OPR\//.test(ua)) return 'opera';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Chrome\/|Chromium\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}
