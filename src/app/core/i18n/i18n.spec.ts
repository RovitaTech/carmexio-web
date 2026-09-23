import { langOf, pathIn, pick } from './i18n';

describe('i18n helpers', () => {
  it('maps LOCALE_ID to a site language', () => {
    expect(langOf('es-MX')).toBe('es');
    expect(langOf('en')).toBe('en');
    expect(langOf('en-US')).toBe('en');
  });

  it('builds the same page in the other language', () => {
    expect(pathIn('en', '/')).toBe('/en');
    expect(pathIn('en', '/autos?q=hilux')).toBe('/en/autos?q=hilux');
    expect(pathIn('es', '/')).toBe('/');
    expect(pathIn('es', '/sucursales')).toBe('/sucursales');
  });

  it('falls back to Spanish when English copy is missing', () => {
    expect(pick({ es: 'Hola', en: 'Hello' }, 'en')).toBe('Hello');
    expect(pick({ es: 'Hola', en: '  ' }, 'en')).toBe('Hola');
    expect(pick({ es: 'Hola' }, 'es')).toBe('Hola');
    expect(pick(undefined, 'es')).toBe('');
  });
});
