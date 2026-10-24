import { MessageKey } from '../../core/i18n/i18n.model';
import { Device, DeviceKind } from '../../core/pwa/device';
import { IconName } from '../../shared/ui/icon/icons';

/*
 * What the install guide says for each device and browser: the browser's own
 * steps, in its own words, with the symbol to look for. Pure data, so every
 * combination is tested without rendering.
 */

export interface GuideStep {
  /** The control to look for on screen, drawn as the browser draws it. */
  readonly icon: IconName;
  readonly title: MessageKey;
  readonly hint: MessageKey | null;
}

/**
 * Steps for a phone. `device` is the visitor's own when they are looking at
 * their own kind of device; null when they picked another one in the guide.
 */
export function phoneSteps(view: 'ios' | 'android', device: Device | null): readonly GuideStep[] {
  const done: MessageKey = 'install.step.done';
  if (view === 'ios') {
    const safari = !device || device.browser === 'safari';
    return [
      {
        icon: 'share-ios',
        title: 'install.ios.share',
        hint: safari ? 'install.ios.share.safari' : 'install.ios.share.other',
      },
      { icon: 'add-square', title: 'install.ios.add', hint: 'install.ios.add.hint' },
      { icon: 'check', title: 'install.ios.confirm', hint: done },
    ];
  }
  const samsung = device?.browser === 'samsung';
  return [
    {
      icon: samsung ? 'menu-lines' : 'menu-dots',
      title: 'install.android.menu',
      hint: samsung ? 'install.android.menu.samsung' : 'install.android.menu.dots',
    },
    {
      icon: 'add-home',
      title: samsung ? 'install.android.add.samsung' : 'install.android.add',
      hint: null,
    },
    { icon: 'check', title: 'install.android.confirm', hint: done },
  ];
}

/** How a computer's browser installs it as an app, or that it can't. */
export function desktopAppStep(device: Device | null): GuideStep {
  switch (device?.browser) {
    case 'chrome':
    case 'opera':
      return {
        icon: 'install-desktop',
        title: 'install.desktop.chromium',
        hint: 'install.desktop.chromium.hint',
      };
    case 'edge':
      return {
        icon: 'install-desktop',
        title: 'install.desktop.chromium',
        hint: 'install.desktop.edge.hint',
      };
    case 'safari':
      return device.mac
        ? {
            icon: 'add-square',
            title: 'install.desktop.safari',
            hint: 'install.desktop.safari.hint',
          }
        : genericStep;
    case 'firefox':
      return {
        icon: 'info',
        title: 'install.desktop.firefox',
        hint: 'install.desktop.firefox.hint',
      };
    default:
      return genericStep;
  }
}

const genericStep: GuideStep = {
  icon: 'install-desktop',
  title: 'install.desktop.generic',
  hint: 'install.desktop.generic.hint',
};

/**
 * The bookmark shortcut. On a computer, the one for its system; seen from a
 * phone, both (the visitor's computer is unknown).
 */
export function bookmarkShortcuts(device: Device): readonly (readonly string[])[] {
  if (device.kind !== 'desktop') {
    return [
      ['Ctrl', 'D'],
      ['Cmd', 'D'],
    ];
  }
  return [device.mac ? ['Cmd', 'D'] : ['Ctrl', 'D']];
}

export const GUIDE_VIEWS: readonly { readonly value: DeviceKind; readonly label: MessageKey }[] = [
  { value: 'ios', label: 'install.device.ios' },
  { value: 'android', label: 'install.device.android' },
  { value: 'desktop', label: 'install.device.desktop' },
];
