import { Device } from '../../core/pwa/device';
import { bookmarkShortcuts, desktopAppStep, phoneSteps } from './guide-content';

const device = (kind: Device['kind'], browser: Device['browser'], mac = false): Device => ({
  kind,
  browser,
  mac,
  inApp: false,
});

describe('install guide content', () => {
  it("walks an iPhone through Safari's Share, Add to Home Screen and Add", () => {
    const steps = phoneSteps('ios', device('ios', 'safari'));
    expect(steps.map((s) => s.icon)).toEqual(['share-ios', 'add-square', 'check']);
    expect(steps[0].hint).toBe('install.ios.share.safari');
    // Chrome on an iPhone has Share in its address bar, not Safari's toolbar.
    expect(phoneSteps('ios', device('ios', 'chrome'))[0].hint).toBe('install.ios.share.other');
  });

  it("uses Samsung Internet's own menu and words", () => {
    const samsung = phoneSteps('android', device('android', 'samsung'));
    expect(samsung[0]).toMatchObject({ icon: 'menu-lines', hint: 'install.android.menu.samsung' });
    expect(samsung[1].title).toBe('install.android.add.samsung');
    const chrome = phoneSteps('android', device('android', 'chrome'));
    expect(chrome[0].icon).toBe('menu-dots');
    expect(chrome[1].title).toBe('install.android.add');
  });

  it('gives the generic steps for a device picked by hand', () => {
    expect(phoneSteps('ios', null)[0].hint).toBe('install.ios.share.safari');
    expect(phoneSteps('android', null)[0].icon).toBe('menu-dots');
    expect(desktopAppStep(null).title).toBe('install.desktop.generic');
  });

  it("points each computer browser to its own place, and says plainly when it can't", () => {
    expect(desktopAppStep(device('desktop', 'chrome')).hint).toBe('install.desktop.chromium.hint');
    expect(desktopAppStep(device('desktop', 'edge')).hint).toBe('install.desktop.edge.hint');
    expect(desktopAppStep(device('desktop', 'safari', true)).title).toBe('install.desktop.safari');
    expect(desktopAppStep(device('desktop', 'firefox')).title).toBe('install.desktop.firefox');
  });

  it('shows the bookmark shortcut of the system, or both when the computer is unknown', () => {
    expect(bookmarkShortcuts(device('desktop', 'chrome'))).toEqual([['Ctrl', 'D']]);
    expect(bookmarkShortcuts(device('desktop', 'safari', true))).toEqual([['Cmd', 'D']]);
    expect(bookmarkShortcuts(device('ios', 'safari'))).toEqual([
      ['Ctrl', 'D'],
      ['Cmd', 'D'],
    ]);
  });
});
