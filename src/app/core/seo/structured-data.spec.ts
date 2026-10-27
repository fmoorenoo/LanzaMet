import { jsonLd, PageFacts, structuredData } from './structured-data';

const facts = (overrides: Partial<PageFacts> = {}): PageFacts => ({
  origin: 'https://lanzamet.com',
  url: 'https://lanzamet.com/mar',
  name: 'Mareas en Lanzarote hoy',
  description: 'Pleamar y bajamar estimadas.',
  lang: 'es',
  crumb: 'Mar',
  home: 'Inicio',
  type: 'WebPage',
  ...overrides,
});

type Node = Record<string, unknown> & { '@type': string };
const graph = (data: object) => (data as { '@graph': Node[] })['@graph'];
const node = (data: object, type: string) => graph(data).find((n) => n['@type'] === type);

describe('structuredData', () => {
  it('names the site, the organisation behind it, its founder and his studio', () => {
    const data = structuredData(facts());
    expect(node(data, 'WebSite')).toMatchObject({ name: 'LanzaMet', url: 'https://lanzamet.com/' });
    expect(node(data, 'Organization')).toMatchObject({
      name: 'LanzaMet',
      logo: { url: 'https://lanzamet.com/icons/icon-512.png' },
      founder: { '@id': 'https://lanzamet.com/#founder' },
    });
    expect(node(data, 'Person')).toMatchObject({
      name: 'Fernando Montelongo',
      sameAs: ['https://www.linkedin.com/in/fernando-montelongo/'],
      memberOf: { name: 'Kora Digital Solutions', url: 'https://koradigitalsolutions.com' },
    });
  });

  it('describes the page as being about Lanzarote, with its breadcrumb', () => {
    const page = node(structuredData(facts()), 'WebPage');
    expect(page).toMatchObject({
      '@id': 'https://lanzamet.com/mar#webpage',
      inLanguage: 'es-ES',
      about: { '@type': 'Place', name: 'Lanzarote' },
      breadcrumb: {
        itemListElement: [
          { position: 1, name: 'Inicio', item: 'https://lanzamet.com/' },
          { position: 2, name: 'Mar', item: 'https://lanzamet.com/mar' },
        ],
      },
    });
  });

  it('gives the home page no breadcrumb, and the About page the organisation as subject', () => {
    const home = node(
      structuredData(facts({ url: 'https://lanzamet.com/', crumb: null })),
      'WebPage',
    );
    expect(home?.['breadcrumb']).toBeUndefined();
    const about = node(structuredData(facts({ type: 'AboutPage', lang: 'en' })), 'AboutPage');
    expect(about).toMatchObject({
      inLanguage: 'en-GB',
      about: { '@id': 'https://lanzamet.com/#organization' },
    });
  });

  it('writes JSON that cannot close its <script> element', () => {
    const text = jsonLd({ name: '</script><script>alert(1)</script>' });
    expect(text).not.toContain('<');
    expect(JSON.parse(text)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
