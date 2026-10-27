# 07 · JavaScript, renderizado y rendimiento

## 1. Qué ve cada rastreador hoy (verificado)

| Visitante | Qué recibe | Qué ve |
|---|---|---|
| Navegador / Googlebot (renderiza JS) | `index.html` de 1 676 bytes + 212 KB de JS (Brotli) | La app completa: 480-955 palabras por página, en **el idioma de su navegador** (T-01) |
| Rastreadores sin JS (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, CCBot; previsualizaciones de WhatsApp, X, Telegram, Facebook) | El mismo HTML | Título genérico «LanzaMet · El tiempo y el mar en Lanzarote», la description genérica y un `<lm-root>` vacío |

HTML inicial servido (todas las rutas, idéntico):

```html
<html lang="es" data-theme="light">
<head><title>LanzaMet · El tiempo y el mar en Lanzarote</title>
<meta name="description" content="Cómo está el día en Lanzarote de un vistazo: …"> …</head>
<body><lm-root></lm-root> <script src="main-….js" type="module"></script></body>
```

**Metadatos antes y después de la hidratación**: antes, el título y la descripción genéricos (iguales en todas las URL); después, el título por ruta y la descripción por idioma. No hay canonical, Open Graph ni JSON-LD en ningún momento.

## 2. Rendimiento medido (laboratorio)

Lighthouse 12.8.2 desde este equipo con Chrome 156 headless, 27-10-2026 ~07:50 UTC, perfil móvil por defecto (Moto G Power simulado, 4G lento, CPU ×4). **Son datos de laboratorio**: no son los Core Web Vitals que usa Google.

| Página | Perf. | FCP | LCP | TBT | CLS | SI | Accesib. | SEO | Elemento LCP |
|---|---|---|---|---|---|---|---|---|---|
| `/` móvil (2 ejecuciones válidas; una 3.ª falló con `NO_NAVSTART`) | 65 / 68 | 3,4 s | 3,9-4,1 s | 450-510 ms | 0 | 4,1-4,2 s | 100 | 91 | `h1#weather-verdict` (texto) |
| `/mar` móvil | 73 | 3,5 s | 4,1 s | 280 ms | 0 | 3,5 s | 100 | 91 | `h1.t-display` |
| `/zonas` móvil | 73 | 3,6 s | 4,0 s | 270 ms | 0 | 3,6 s | 100 | 91 | `h1.t-display` |
| `/` escritorio | 96 | 0,7 s | 1,1 s | 90 ms | 0,014 | 1,2 s | — | 92 | `h1#weather-verdict` |

- **SEO 91**: el único fallo es `robots-txt` («26 errores»): Lighthouse lee el HTML de la app como si fuera el robots.txt (T-02).
- Auditorías en rojo (móvil): `render-blocking-resources` (ahorro estimado de 830-870 ms), `network-dependency-tree`, `forced-reflow`, `mainthread-work-breakdown` (5,6-9,5 s), `dom-size` (1 435 elementos en Hoy, 2 440 en Zonas), `unused-javascript` (27-55 KiB), `max-potential-fid` 330-380 ms.
- El README declaraba de 75 a 81 en Lighthouse móvil local (mediana de 3). La diferencia es esperable entre equipos y redes; no indica regresión.
- **Datos de campo (CrUX / Search Console)**: no disponibles. La web tiene 3 días y necesita tráfico suficiente; PageSpeed Insights devolvió 429 (cuota anónima agotada).

### Lectura

- **LCP ≈ 4 s en móvil = «necesita mejorar»** (umbral bueno ≤ 2,5 s). El LCP es **texto que depende de JS y de datos**: el H1/veredicto no existe hasta que descarga el JS, arranca Angular y llegan los datos de Open-Meteo. Ninguna optimización de imágenes lo arreglará: lo arregla tener texto en el HTML.
- **CLS = 0**: excelente (el README documenta el trabajo hecho).
- **TBT 270-510 ms**: riesgo de INP medio en móviles modestos. Zonas tiene 2 440 elementos (mapa con costa en SVG + tarjetas con miniescena).
- **TTFB 50-120 ms** (laboratorio) y 160-190 ms (curl desde Madrid): bueno, servido desde la caché de Cloudflare.

## 3. Bundles, caché y recursos (verificado)

| Recurso | Sin comprimir | Brotli | `Cache-Control` |
|---|---|---|---|
| `main-TI4OWOFL.js` | 274 KB | 82 KB | `public, max-age=0, must-revalidate` |
| `chunk-2D2cvdqR.js` | 279 KB | 92 KB | ídem |
| `chunk-2PGFSjwg.js` | 99 KB | 30 KB | ídem |
| `chunk-wOinoiYF.js` + `chunk-DqfW5mXc.js` | 22 KB | 8 KB | ídem |
| `styles-HYU4PF7C.css` | 19 KB | 5 KB | ídem |
| `install-prompt.js` | 0,4 KB | 0,3 KB | `no-cache` (correcto: no lleva hash) |

- **Code splitting**: correcto (Hoy en el bundle inicial a propósito; el resto, diferido).
- **P-01 · Caché**: los archivos con hash pueden llevar `public, max-age=31536000, immutable`. Hoy cada visita repetida sin service worker revalida 6 archivos (6 respuestas 304). Cambio en `public/_headers` por prefijo (`/main-*`, `/chunk-*`, `/styles-*`, `/polyfills-*`, `/media/*`), **sin tocar** `ngsw-worker.js`, `ngsw.json`, `safety-worker.js`, `install-prompt.js`, `manifest.webmanifest` ni el HTML.
- **Fuentes**: Bricolage Grotesque variable autoalojada, `font-display: swap`, tres subconjuntos con `unicode-range`. Mejora menor: `<link rel="preload" as="font" type="font/woff2" crossorigin>` del subconjunto latino (comprobar antes que el nombre con hash se pueda referenciar desde el build).
- **CSS que bloquea el renderizado**: `inlineCritical: false` está desactivado a propósito. El CSS crítico de Angular usa un `onload` en línea que la CSP (`script-src 'self'`) bloquearía. Con prerender, el primer pintado ya tendrá contenido, y el bloqueo de 5 KB de CSS pesa menos.
- **APIs**: 3 peticiones a Open-Meteo (copia compartida en el Worker), avisos y observaciones. Caché en `localStorage`. Bien resuelto.
- **Mapas y gráficos**: SVG y canvas propios; sin librerías de terceros. La costa de Zonas (`island-map/coastline.ts`) aporta muchos nodos al DOM.

## 4. ¿Hace falta prerender o SSR? Opciones

Google renderiza JS, así que **no es imprescindible para aparecer en Google**. Sí lo es para:

1. Tener **title, description, canonical, hreflang y JSON-LD distintos por URL** en el HTML (Google recomienda el canonical en HTML).
2. Devolver **404 reales** y servir `robots.txt` y `sitemap.xml` sin trucos.
3. Que **buscadores de IA y redes** vean contenido.
4. Bajar el **LCP** (texto estable en el HTML).
5. Que las **URLs por zona e idioma** nazcan con su contenido propio.

| Opción | Qué es | Plan de Cloudflare | Frescura del dato en el HTML | Esfuerzo | Riesgo | Veredicto |
|---|---|---|---|---|---|---|
| **A. Prerender (SSG)** con `@angular/ssr`, `outputMode: "static"`, `RenderMode.Prerender` por ruta, `getPrerenderParams` para las 9 zonas | HTML estático por ruta en el build; los datos vivos llegan en el navegador | Gratis (son assets) | Solo texto estable; sin números del día | Medio-alto | Hidratación con estado de `localStorage`; service worker | **Recomendada (fase 1)** |
| B. HTMLRewriter en el Worker | Servir `index.html` reescribiendo `<title>`, metas y JSON-LD por ruta, y opcionalmente una frase con el dato del día desde la copia de Open-Meteo que ya tiene el Worker | Gratis, pero cada HTML pasa por el Worker (cuenta en las 100 000 peticiones/día) | Puede incluir el dato del día | Medio | Duplicar la lógica de textos fuera de Angular; Angular borra el contenido de `<lm-root>` al arrancar | Complemento posible (fase 3) |
| C. SSR en el borde (`AngularAppEngine` + `createRequestHandler` en el Worker) | Render por petición con datos reales, con caché de 10 min | El plan gratuito da **10 ms de CPU por petición** ([límites de Workers](https://developers.cloudflare.com/workers/platform/limits/)). Un render de Angular de esta app probablemente los supera (hipótesis: medir). Workers Paid: 30 s por defecto | Total | Alto | Coste, CPU, hidratación | Solo si A no basta y con medición previa |
| D. Renderizado dinámico (servir HTML distinto a bots) | — | — | — | — | Google lo considera un apaño, no una solución recomendada | **Descartada** |

### 4.1 Diseño de la opción A

> **Implementada el 27-10-2026** con dos cambios respecto a este diseño: sin hidratación (la app redibuja la página al arrancar) y 404 servido por el Worker en lugar de `404.html`, porque Cloudflare no sirve `404.html` cuando hay un Worker. El fallback sin conexión es `index.csr.html`, probado. Detalle y resultados en `14-backlog-seo.md` (B-10).

- **Qué se prerenderiza**: shell de navegación, H1 y textos estables de cada ruta, bloque «Sobre esta zona», enlaces internos, metadatos, JSON-LD y esqueletos de los datos.
- **Qué no**: nada que dependa de la hora o de los datos (veredicto, temperatura, marea, escena). El prerender no debe pintar un tiempo concreto: quedaría congelado en el momento del build.
- **Rutas**: todas las de `05-arquitectura-seo.md` (ES, más EN cuando exista), con `getPrerenderParams` devolviendo los 9 slugs de `LOCATIONS`.
- **404**: componente `NotFound` prerenderizado como `404.html` y `wrangler.jsonc` → `"not_found_handling": "404-page"`. Cloudflare devuelve entonces 404 con ese HTML para cualquier ruta sin archivo. **Comprobar** que ninguna ruta válida queda sin prerenderizar (cualquier olvido daría 404).
- **Hidratación** (`provideClientHydration()`). Riesgos concretos del código actual:
  - `I18n.lang` lee `localStorage`/`navigator` en la construcción (`i18n.store.ts:30`). Con idioma por URL, el idioma viene de la ruta: el servidor y el cliente coinciden.
  - `LocationsStore.selectedId` lee `localStorage` (`locations.store.ts:56`). En `/tiempo/{zona}` manda la URL; en `/`, el prerender usa la zona por defecto. Si el visitante tenía otra guardada, el cambio ocurre después de hidratar (como hoy, tras cargar).
  - `ThemeStore`, `ClockStore` (`new Date()`), escena, canvas, `matchMedia`, `navigator.share`: deben ejecutarse solo en el navegador (`afterNextRender`, `isPlatformBrowser`) o en bloques `@defer` / `@if` que el servidor no pinte. El `CLAUDE.md` del proyecto ya pide no dar por hecho globales como `new Date()`.
  - Usar `withIncrementalHydration()` y `@defer (hydrate on …)` para la escena y la tira de horas si el TBT empeora.
- **Service worker**: hoy `ngsw` sirve `index.html` como respuesta de navegación sin conexión. Con prerender, `/index.html` es la portada prerenderizada; servirla en `/mar` sin red **produciría un error de hidratación** (NG0500). Hay que configurar un fallback CSR (shell sin contenido, p. ej. `index.csr.html`) o revisar `navigationUrls`. Probarlo sin conexión.
- **CSP**: el JSON-LD va en `<script type="application/ld+json">`. No se ejecuta, así que `script-src 'self'` no lo bloquea, pero `scripts/build-production.ts` comprueba que `index.html` no tenga scripts en línea: ampliar la comprobación para permitir solo ese tipo.
- **Build**: `scripts/build-production.ts` debe seguir comprobando el service worker, las cabeceras, el manifest y la ausencia de código de demo en **todos** los HTML generados, no solo en `index.html`.

### 4.2 Resultado esperado (hipótesis, a medir)

- LCP móvil: el texto del H1 estará en el HTML; el LCP pasaría a ser ese texto, pintado tras el CSS y la fuente. Objetivo ≤ 2,5 s en laboratorio. **No se promete**: hay que medirlo antes y después.
- Sin cambios en CLS (hay que vigilarlo: el esqueleto prerenderizado debe ocupar lo mismo que el contenido final).

## 5. Otras mejoras de rendimiento (P2, salvo P-01, que es P1 por su coste mínimo: B-14)

| Id | Mejora | Archivos | Comprobación |
|---|---|---|---|
| P-01 | Caché inmutable para archivos con hash | `public/_headers` | `curl -I …/main-*.js` → `max-age=31536000, immutable` |
| P-02 | Contenido de los paneles (zona, día, ajustes) solo al abrirse | `layout/location-picker`, `layout/day-picker`, `layout/settings-panel`, `app.html` | Menos nodos en el DOM; Lighthouse `dom-size` |
| P-03 | Zonas: simplificar la costa SVG o diferir las miniescenas fuera de pantalla (`@defer (on viewport)`) | `features/zones/island-map/*`, `zones.page.html` | `dom-size` < 1 500 en `/zonas`; TBT |
| P-04 | Investigar el `forced-reflow` (lecturas de layout tras escrituras) | Directiva de scroll horizontal, escena | Panel Performance de DevTools |
| P-05 | Precargar la fuente latina | `src/index.html` o build | Waterfall |

## 6. Medición continua

- Search Console → Core Web Vitals (cuando haya tráfico) y CrUX Vis.
- No hay analítica (decisión de privacidad). Para RUM sin cookies se podría usar `web-vitals` enviando a `/api/` propio, agregado y sin identificadores. **Contradice la promesa actual** («sin herramientas de analítica») y habría que cambiar Legal antes. Decisión del responsable, P3.
- Las navegaciones internas de la SPA (cambios de ruta) no cuentan en CrUX; solo la primera carga.
