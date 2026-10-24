import { detectDevice } from './device';

// Real user agents of current browsers (October 2026 builds, trimmed of nothing).
const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1',
  iphoneInstagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 401.0.0.39.82',
  // iPadOS asks for the desktop site and reads exactly like a Mac.
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 15; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 15; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
  androidWebView:
    'Mozilla/5.0 (Linux; Android 15; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  windowsFirefox:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  linuxOpera:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0',
};

describe('detectDevice', () => {
  it('tells iPhones apart, by browser, and spots the browsers inside other apps', () => {
    expect(detectDevice(UA.iphoneSafari, 5)).toEqual({
      kind: 'ios',
      browser: 'safari',
      mac: false,
      inApp: false,
    });
    expect(detectDevice(UA.iphoneChrome, 5).browser).toBe('chrome');
    expect(detectDevice(UA.iphoneInstagram, 5)).toMatchObject({ kind: 'ios', inApp: true });
  });

  it('recognises an iPad that calls itself a Mac by its touch screen', () => {
    expect(detectDevice(UA.ipad, 5)).toMatchObject({ kind: 'ios', browser: 'safari', mac: false });
    // The same words with a mouse are a real Mac.
    expect(detectDevice(UA.macSafari, 0)).toEqual({
      kind: 'desktop',
      browser: 'safari',
      mac: true,
      inApp: false,
    });
  });

  it('names the Android browser, Samsung Internet before the Chrome it also mentions', () => {
    expect(detectDevice(UA.androidChrome, 5)).toMatchObject({ kind: 'android', browser: 'chrome' });
    expect(detectDevice(UA.androidSamsung, 5).browser).toBe('samsung');
    expect(detectDevice(UA.androidFirefox, 5).browser).toBe('firefox');
    expect(detectDevice(UA.androidWebView, 5)).toMatchObject({ kind: 'android', inApp: true });
  });

  it('names the computer browser, Edge and Opera before the Chrome they also mention', () => {
    expect(detectDevice(UA.windowsChrome)).toEqual({
      kind: 'desktop',
      browser: 'chrome',
      mac: false,
      inApp: false,
    });
    expect(detectDevice(UA.windowsEdge).browser).toBe('edge');
    expect(detectDevice(UA.windowsFirefox).browser).toBe('firefox');
    expect(detectDevice(UA.linuxOpera).browser).toBe('opera');
    expect(detectDevice(UA.macChrome)).toMatchObject({ browser: 'chrome', mac: true });
  });

  it('falls back to an unknown computer browser rather than guessing', () => {
    expect(detectDevice('')).toEqual({
      kind: 'desktop',
      browser: 'other',
      mac: false,
      inApp: false,
    });
  });
});
