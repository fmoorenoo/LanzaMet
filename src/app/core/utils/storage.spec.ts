import { isString, readStored, writeStored } from './storage';

describe('stored preferences', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('reads and writes under the LanzaMet prefix', () => {
    writeStored('theme', 'dark');
    expect(localStorage.getItem('lm.theme')).toBe('"dark"');
    expect(readStored('theme', isString)).toBe('dark');
  });

  it('keeps what was saved while the app was "¿Qué tal hoy?", and moves it once', () => {
    localStorage.setItem('qth.selected', '"famara"');
    expect(readStored('selected', isString)).toBe('famara');
    expect(localStorage.getItem('lm.selected')).toBe('"famara"');
    expect(localStorage.getItem('qth.selected')).toBeNull();
  });

  it('prefers the new key when both exist', () => {
    localStorage.setItem('lm.lang', '"en"');
    localStorage.setItem('qth.lang', '"es"');
    expect(readStored('lang', isString)).toBe('en');
  });
});
