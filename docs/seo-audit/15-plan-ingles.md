# 15 · Plan de implementación: inglés en `/en` (B-18)

Fecha: 29-10-2026. Desarrolla B-18 (`14-backlog-seo.md`) y la estructura de `09-internacional-geo.md` §A, con lo que hay hoy en el código.

## Estado (29-10-2026): implementado en la rama `feat/ingles-en`, sin publicar

Comprobado en local, con la build de producción servida por `wrangler dev`:

- `npm run build:prod` en verde: 54 páginas prerenderizadas (26 por idioma y las 2 redirecciones de Papagayo) y 50 URLs en el sitemap (25 + 25). La build comprueba en cada página el `<html lang>`, el canonical, las tres versiones `hreflang` y su reciprocidad, y que ningún enlace interno salga de su idioma.
- 266 tests en verde (251 antes) y lint en verde.
- `/en` y `/en/sea/famara` devuelven 200; `/en/` redirige a `/en`; `/en/xyz` devuelve 404 y pinta «Page not found» en inglés.
- En Chrome sin interfaz, a 390 px, las 11 vistas en inglés salen con su `lang`, H1 y title en inglés, y sin desbordamiento horizontal. También se ha comprobado a 1440 px.
- Cambio de idioma: el enlace del pie lleva de `/en/sea/famara?dia=…` a `/mar/famara?dia=…` y guarda la elección. En Ajustes la página pasa a `/en/places`, el panel sigue abierto y el foco se queda en la opción elegida.
- Elección guardada: con `lm.lang = "en"`, entrar por `/mar` abre `/en/sea`; sin elección, `/mar` se queda en español.

Pendiente:

- Validar con capturas el enlace «English / Español» al final de cada página (D2).
- Que alguien nativo valide los textos en inglés (D4).
- AXE y Lighthouse en `/en` y `/en/sea/famara`.
- Publicar, y después lo de §7.

Diferencias con lo planeado:

- El enlace de idioma no va dentro de `.page-foot`, porque solo cuatro páginas tienen pie. Va al final de `<main>` en el shell de la app (`app.html`), así que sale en todas.
- La elección guardada redirige desde la guarda de ruta `speak` (`lang-route.ts`), con `RedirectCommand` y `replaceUrl`, solo cuando `router.navigated` es falso. El idioma se pone en esa misma guarda, antes de construir la página, en vez de en `ResolveEnd`.
- El titular de la imagen inglesa de Mar es «Lanzarote tides and sea today», porque «Tides and sea conditions in Lanzarote» ocupaba tres líneas.

## 1. Punto de partida (verificado en el código)

Lo que ya está hecho y no hay que rehacer:

- **Traducción completa y tipada**: `messages/en.ts` está tipado contra `es.ts` (una clave que falta no compila) y un test comprueba los marcadores. Ningún texto visible está fuera de los diccionarios: los únicos literales en español son nombres propios (zonas, municipios, estaciones), que no se traducen.
- **Las reglas no escriben frases** (`core/insights` devuelve `Msg`), así que la lógica es una sola para los dos idiomas.
- **SEO por página ya bilingüe**: titles y descriptions `seo.*` en inglés y pensados para búsquedas británicas («tide times», «weather today»), `og:locale` y `og:locale:alternate`, `inLanguage` en el JSON-LD.
- **Prerender** de las 26 páginas en español (`app.routes.server.ts`), con comprobaciones en `scripts/build-production.ts` y un sitemap generado.
- Webcams con URL por idioma, avisos de AEMET con `descriptionEn`, y el idioma de la web ya se envía con «Ayúdanos».

Lo que falta: **el idioma no está en la URL**. Hoy `I18n.lang` sale de la elección guardada (`lm.lang`) o, si no hay, de `es`. Por eso:

- Google solo puede indexar una versión por URL (la española, desde B-01a).
- Un visitante con `lm.lang = "en"` ve **inglés en una URL que el HTML y el canonical declaran española**.
- No existe ninguna URL en inglés que posicionar ni que compartir.

## 2. Objetivo y aceptación

Cada página existe en las dos versiones, cada una con su URL, prerenderizada en su idioma y enlazada a la otra con `hreflang`.

Criterios de aceptación (los de `09` §A.6, ampliados):

1. `curl https://lanzamet.com/en/sea` devuelve un HTML con `<html lang="en">`, title y description en inglés, canonical `https://lanzamet.com/en/sea` y las tres alternativas `es`, `en` y `x-default`.
2. Las 52 páginas prerenderizadas (26 + 26) superan las comprobaciones de la build, `hreflang` recíproco incluido. El sitemap tiene 50 URLs (`/mejorar` y `/en/feedback` llevan `noindex`).
3. Ninguna URL cambia de idioma sola para un visitante sin elección guardada ni para un rastreador.
4. Cambiar de idioma lleva a la URL equivalente, conservando la zona, el día (`?dia=`) y el ancla.
5. Search Console → Inspección de URL muestra `/` en español y `/en` en inglés.
6. AXE sin errores, Lighthouse en accesibilidad y SEO al 100 en `/en` y `/en/sea/famara`, y ningún desbordamiento a 390, 820 y 1440 px con los textos en inglés.

## 3. Decisiones

### Ya tomadas (vienen de `09` §A)

| Tema | Decisión |
|---|---|
| Estructura | Español en la raíz, inglés bajo `/en`. Sin subdominio, sin `?lang=` |
| Slugs | Traducidos (`/en/places`, `/en/sea`…). Los de zona no se traducen (`famara`, `playa-blanca`) |
| `hreflang` | `es`, `en` y `x-default` → español, en el `<head>` prerenderizado. **No** se repiten en el sitemap |
| Canonical | Autorreferente en cada idioma |
| Redirecciones | Ninguna por `Accept-Language`, IP ni user agent |
| Barra final | `/en` sin barra (como el resto: `html_handling: drop-trailing-slash`). `09` §A.3 escribía `/en/`: se corrige |
| Parámetro del día | `?dia=` en los dos idiomas: lo quita el canonical y no se indexa |

### Decididas por el responsable (29-10-2026): las cuatro, como se recomendaba

| # | Pregunta | Recomendación (elegida) | Alternativa |
|---|---|---|---|
| D1 | Alguien eligió inglés en Ajustes (`lm.lang = "en"`) y abre `/mar`. ¿Qué ve? | **Al entrar en la web, y solo entonces, la app navega a `/en/sea`** (`replaceUrl`, en el navegador). El HTML de `/mar` sigue en español para todos. Los rastreadores no guardan nada, así que nunca se les redirige. Además, quien ya tiene `lm.lang = "en"` hoy pasa a sus URLs en inglés sin hacer nada, y la app instalada (que abre `/`) se abre en inglés para quien lo eligió | Que vea español con la tarjeta «Read in English». Es más puro, pero la elección guardada deja de servir para nada |
| D2 | ¿Un enlace visible al otro idioma en cada página? | **Sí**: «English» o «Español» en el pie de cada página (`.page-foot`), como `<a href hreflang lang>`. Así los rastreadores que no leen `hreflang` también encuentran la otra versión, y un visitante la tiene a mano sin abrir Ajustes. Es un cambio de diseño pequeño: validarlo con una captura | Solo Ajustes y la tarjeta de sugerencia, como ahora |
| D3 | El manifest de la PWA admite un solo idioma | **Uno solo, en español, con `start_url: "/"`**. Con D1, quien eligió inglés acaba en `/en` | Un segundo manifest para `/en`, que sería otra app instalable con otro `id`. Lo desaconsejo |
| D4 | Revisión del inglés | Yo reviso los textos que leen los buscadores (H1, intros, «Sobre la zona», Sobre, Legal, `seo.*`), y tú, o alguien nativo, los validas. En Legal, añadir «The Spanish version prevails» | Publicar los textos actuales tal cual |

## 4. Mapa de URLs

| Página (`PageId`) | Español | Inglés | Indexable |
|---|---|---|---|
| `today` | `/` | `/en` | Sí |
| `weatherZone` | `/tiempo/{zona}` | `/en/weather/{zona}` | Sí (×9) |
| `zones` | `/zonas` | `/en/places` | Sí |
| `sea` | `/mar` | `/en/sea` | Sí |
| `seaZone` | `/mar/{zona}` | `/en/sea/{zona}` | Sí (×9) |
| `plans` | `/donde-ir` | `/en/where-to-go` | Sí |
| `wind` | `/viento` | `/en/wind` | Sí |
| `about` | `/sobre` | `/en/about` | Sí |
| `legal` | `/legal` | `/en/legal` | Sí |
| `feedback` | `/mejorar` | `/en/feedback` | No (`noindex`) |
| no encontrada | `/**` | `/en/**` | No (404, en el idioma de su prefijo) |

`/tiempo/papagayo` y `/mar/papagayo` siguen redirigiendo (301). No hacen falta equivalentes en inglés, porque nunca existieron.

## 5. Qué hay que tocar, archivo por archivo

### 5.1 Una sola tabla de rutas por idioma (nuevo)

**`src/app/core/i18n/localized-paths.ts`** (+ `.spec.ts`). Es la única fuente de las URLs. Hoy están repartidas a mano en 11 archivos.

- `PAGE_SLUGS: Record<PageId, Record<Lang, string>>` y `ZONE_VIEW_SLUGS` (`tiempo`/`weather`, `mar`/`sea`).
- `pagePath(page, lang)` → `'/zonas'`, `'/en/places'`, `'/'`, `'/en'`.
- `zonePath(view, id, lang)`: sustituye a la de `zone-navigation.ts`.
- `langOfPath(path)`: `'en'` para `/en` y `/en/…`, `'es'` para todo lo demás.
- `alternatePath(url, lang)`: la URL equivalente en el otro idioma, conservando `?query` y `#ancla`, o `null` si no tiene equivalente (404). Se usa para el `hreflang`, el selector, el enlace del pie y D1.
- Test de ida y vuelta para **todas** las rutas y zonas: `alternatePath(alternatePath(x, 'en'), 'es') === x`.

### 5.2 Rutas

- **`app.routes.ts`**: la tabla actual pasa a ser `pageRoutes(lang)`, que genera las rutas de un idioma con sus slugs. El resto queda igual: títulos, `seo()`, `data.page`, guardas y `loadComponent`. Español en la raíz y `{ path: 'en', children: pageRoutes('en') }` **antes** del `**` español. Cada grupo lleva su propio `**`.
  - Dentro de `children`, `knownZone` sigue leyendo `segments[1]`, que es relativo a la ruta. Si se aplanaran como `'en/weather/:zona'`, se rompería.
  - `data.parent.path: '/zonas'` pasa a `parent: { label, page: 'zones' }`, y `SeoTags` lo resuelve por idioma.
  - `PAGE_PATHS` desaparece. La lista prerenderizada sale de `PAGE_SLUGS`.
- **`app.routes.server.ts`**: prerender de las páginas y de las zonas en los dos idiomas (`eachPlace(view, lang)`), generado desde la misma tabla.
- **`core/state/zone-navigation.ts`**: `view()` deja de comparar con `'/tiempo/'` y `'/mar'` y usa `langOfPath` y la tabla. `switchTo` y `open` navegan en el idioma actual.
- **`core/state/same-page.ts`**: sin cambios. Al pasar de `/mar` a `/en/sea` la página se crea de nuevo (el grupo `en` es otra ruta), y está bien así.

### 5.3 Idioma desde la URL

- **`core/i18n/i18n.store.ts`**:
  - `lang` sale de la URL: `langOfPath(document.location.pathname)` al arrancar, de forma síncrona y antes del primer pintado, también en el prerender. Después se actualiza en cada navegación, al empezar la activación (`ResolveEnd`) y no en `NavigationEnd`, para que la página nueva se pinte ya en su idioma.
  - `chosen` (`lm.lang`) deja de decidir el idioma: solo guarda la elección para D1 y para no repetir la sugerencia.
  - `use(lang)` guarda la elección **y navega** a `alternatePath(router.url, lang)`. Sin equivalente (404), navega a la portada de ese idioma.
  - D1: en la primera navegación, si hay elección guardada distinta del idioma de la URL y no es un rastreador, navega a la equivalente con `replaceUrl`.
  - `suggestion` se mantiene, pero compara con el idioma de la URL. En `/en`, a un navegador en español le ofrece «Leer en español».
- **`layout/language-selector`**: los botones de opción siguen como están (tienen buena accesibilidad) y llaman a `use()`, que ahora navega. Hay que comprobar que el panel de Ajustes sigue abierto y que el foco se queda en la opción elegida.
- **`layout/language-suggestion`**: el botón pasa a ser un `<a href hreflang>` a la URL equivalente (también funciona con el botón central y «abrir en pestaña nueva») y guarda la elección.
- **Enlace del pie (D2)**: un componente pequeño `lm-language-link` dentro de `.page-foot`, con `href` = `alternatePath`, y `hreflang` y `lang` del destino (WCAG 3.1.2, idioma de las partes). Va en todas las páginas que tienen pie.

### 5.4 Enlaces internos fijos (11 archivos)

Todos pasan a la tabla mediante un pipe puro con el idioma como argumento (`'zones' | path: lang`) o con `computed`:

| Archivo | Rutas fijas hoy |
|---|---|
| `layout/nav-bar/nav-bar.ts` + `.html` | `/`, `/zonas`, `/mar`, `/donde-ir`; `activeIndex` compara con `'/tiempo/'` |
| `layout/settings-panel/settings-panel.html` | `/sobre`, `/mejorar`, `/legal` |
| `features/not-found/not-found.page.ts` | `/zonas`, `/mar`, `/donde-ir` |
| `features/today/today.page.html` | `/viento`, `/donde-ir` |
| `features/today/conditions/conditions.html` | `/mar` ×2 |
| `features/about/about.page.html` | `/legal`, `/mejorar` |
| `features/legal/legal.page.html` | `/mejorar` |
| `features/zones/zones.page.ts` | `zonePath('weather', …)` |
| `features/wind/wind.page.ts` | `zonePath('weather', …)` |
| `shared/zone-about/zone-about.ts` | `zonePath(…)` ×2 |
| `features/today/share/share-weather.ts` | El enlace compartido pasa a `zonePath(…, lang)`: quien comparte en inglés comparte la URL inglesa |

Para que no vuelva a pasar: una regla de lint o un test que falle si aparece `routerLink="/…"` literal en `src/app`.

### 5.5 SEO

- **`core/seo/seo-tags.ts`**:
  - Las etiquetas `<link rel="alternate" hreflang="es|en|x-default">` salen de `alternatePath` y se escriben con atributos, como el canonical, para que vayan en el prerender. Se quitan en las páginas con `noindex`.
  - Las migas de pan apuntan a la portada y a la sección madre **del idioma de la página**.
  - `og:image` → `/og/{image}.jpg` en español y `/og/en/{image}.jpg` en inglés.
- **`core/seo/structured-data.ts`**: la URL de «Inicio» en las migas, por idioma (hoy siempre `${origin}/`). `WebSite.inLanguage` como lista `['es-ES', 'en-GB']`, porque el sitio tiene un solo `@id` y es bilingüe. `WebPage.inLanguage` sigue siendo el de la página.
- **`public/og/en/*.jpg`** (nuevo, 6 imágenes de 1200 × 630): las actuales llevan el texto en español en la propia imagen y no hay script que las genere. Se rehacen con el mismo diseño y el texto en inglés. Propongo dejar en `scripts/` el generador (HTML + Chrome headless) para poder rehacerlas.
- **`public/robots.txt`**: sin cambios. **`_redirects`**: sin cambios.

### 5.6 Build y publicación

**`scripts/build-production.ts`**:

- Comprobación de idioma por archivo: `lang="en"` en `en/**` y `lang="es"` en el resto. Hoy exige `es` en todo y fallaría.
- Canonical genérico, como ahora, pero sin fijar el idioma.
- **Nueva**: cada página indexable lleva sus tres `hreflang`, cada alternativa existe como página prerenderizada y la alternativa de la alternativa vuelve a la página (reciprocidad). Así un fallo de `hreflang` no llega a publicarse.
- Sitemap: las 50 URLs, primero las españolas y luego las inglesas en el mismo orden. Sin `xhtml:link`.
- El resumen final cuenta las páginas por idioma.

Sin cambios, pero verificar en local con `npm run preview`:

- **`wrangler.jsonc`**: `/en` sirve `en/index.html`, y `/en/` redirige a `/en`.
- **`server/api.ts` (`notFoundPage`)**: `/en/xyz` devuelve 404 con la página vacía de la app, y la app pinta «Page not found» en inglés porque el idioma sale de la URL. El `lang="es"` de esa página vacía dura hasta que arranca la app, y no se indexa.
- **`ngsw-config.json`**: sin conexión, `/en/sea` abre `index.csr.html` y la app lo pinta en inglés.
- **`public/_headers`**: las páginas prerenderizadas ya usan la caché por defecto (revalidación). No hace falta nada para `/en`.
- **`public/manifest.webmanifest`**: sin cambios (D3).

### 5.7 Textos

- Claves nuevas en `es.ts` y `en.ts`: la etiqueta accesible del enlace de idioma y la sugerencia inversa («Leer en español»). El nombre de cada idioma se escribe en ese mismo idioma, como en el selector.
- Revisión del inglés (D4), por prioridad: `seo.*` (titles, descriptions, H1), «Sobre la zona», `/sobre`, `/legal` y los textos fijos de `/viento` y `/donde-ir`.

### 5.8 Tests

| Archivo | Cambio |
|---|---|
| `core/i18n/localized-paths.spec.ts` (nuevo) | Tabla completa, ida y vuelta, `?dia=` y `#ancla`, `null` en el 404 |
| `core/i18n/i18n.spec.ts` | «respects a remembered choice» pasa a ser: la URL manda, la elección guardada solo navega una vez al entrar (D1), y un rastreador nunca navega. Sugerencia en `/en` para un navegador en español |
| `core/seo/seo-tags.spec.ts` | `hreflang` en ES y EN, canonical en EN, sin `hreflang` en el 404, imagen OG en EN |
| `core/seo/structured-data.spec.ts` | Migas e «Inicio» en EN, `inLanguage` |
| `core/state/zone-navigation.spec.ts` | `zonePath` con idioma, `view()` y `switchTo` en `/en/…` |
| `shared/zone-about/zone-about.spec.ts`, `features/wind/wind.page.spec.ts` | Enlaces en EN |
| Nav-bar (nuevo o en un spec existente) | Pestaña activa en `/en/weather/famara` y `/en/sea/orzola` |

### 5.9 Documentación

- `README.md`: §Idiomas (el idioma sale de la URL; la elección solo redirige al entrar) y §SEO (línea «siempre español por URL»).
- `docs/seo-audit/14-backlog-seo.md`: estado de B-18.
- `docs/seo-audit/09-internacional-geo.md` §A.3: `/en` sin barra.
- `PROGRESS.md`.

## 6. Orden de trabajo (un commit por paso, cada uno con sus tests en verde)

1. **Tabla de rutas** y sustitución de las rutas fijas de los 11 archivos, todavía solo en español. No cambia nada visible, y deja preparado todo lo demás.
2. **Rutas `/en` e idioma desde la URL**: `pageRoutes(lang)`, prerender EN e `I18n`.
3. **SEO**: `hreflang`, migas, JSON-LD y las imágenes OG en inglés.
4. **Cambio de idioma**: selector, sugerencia, enlace del pie (D2) y elección guardada (D1).
5. **Build**: comprobaciones por idioma, reciprocidad y sitemap.
6. **Revisión de textos en inglés** (D4).
7. **Verificación y documentación**: `npm test && npm run test:api && npm run lint`, `npm run deploy:check` y `npm run preview`, con `curl` a `/en`, `/en/`, `/en/sea/famara` y `/en/xyz`. Capturas a 390, 820 y 1440 px en los dos idiomas, AXE y Lighthouse en `/en` y `/en/sea/famara`, y prueba sin conexión con el service worker.

Esfuerzo estimado: L (3-5 días de trabajo).

## 7. Después de publicar

1. Search Console: volver a enviar el sitemap e inspeccionar `/en`, `/en/sea` y `/en/weather/playa-blanca`. Pedir la indexación de esas tres.
2. Bing Webmaster Tools: el mismo sitemap. Con IndexNow (B-25) se avisa de las 25 URLs nuevas.
3. Entre 2 y 4 semanas después, en Search Console → Páginas: las URLs `/en/…` como «Indexada» y no como «Duplicada». En Rendimiento, filtrar por `/en/` para ver las primeras consultas en inglés.
4. Con datos, seguir con `/en/climate/{month}` (B-19), que es donde está el volumen británico (`03` §3.7).

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un enlace interno se queda en español dentro de `/en` | Paso 1 primero, regla de lint contra rutas literales, y en el paso 7 recorrer `/en` comprobando que ningún `href` sale de `/en` (salvo el enlace de idioma) |
| `hreflang` no recíproco o hacia una página inexistente | Comprobación en la build: no se publica |
| Pintado en el idioma equivocado al cambiar de página | Idioma actualizado en `ResolveEnd` y test de navegación entre idiomas |
| Textos ingleses más largos que desbordan | Capturas a 390 px en inglés de todas las páginas, y repetir la medida de desplazamiento de layout (README: 0 px en los dos idiomas) |
| D1 interpretado como redirección engañosa | Solo con una elección explícita guardada en el dispositivo, nunca por cabeceras. Google no tiene almacenamiento, así que ve cada URL tal cual |
| Duplicar el tiempo de build y el peso del despliegue | 52 páginas de unos 30 KB: insignificante para Cloudflare |
