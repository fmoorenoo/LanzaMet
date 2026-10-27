# 14 · Backlog SEO (listo para ejecutar más adelante)

> **Ninguna de estas tareas se ha ejecutado.** Están escritas para que Claude Code (u otra persona) las implemente una a una en una fase posterior.

Convenciones para quien implemente:

- Seguir `CLAUDE.md`: componentes standalone sin `standalone: true`, signals, `input()`/`output()`, `inject()`, `@Service()` para servicios nuevos, control de flujo nativo, sin `ngClass`/`ngStyle`, AXE y WCAG AA.
- Cada texto nuevo va en `messages/es.ts` **y** `messages/en.ts` (el tipado lo exige).
- No cambiar el diseño, el menú ni la navegación salvo donde la tarea lo diga explícitamente, y entonces validarlo antes con el responsable.
- Antes de publicar: `npm test && npm run test:api && npm run lint`, y `npm run deploy:check`.
- Una tarea = un commit (o una PR), con su prueba.

Formato de cada tarea: **Prioridad · Esfuerzo (S ≤ ½ día, M 1-3 días, L > 3 días) · Depende de**.

---

## P0 · Errores críticos comprobados

## Estado

| Tarea | Estado | Fecha | Nota |
|---|---|---|---|
| B-01a | ✅ Completada · pendiente de publicar | 27-10-2026 | `i18n.store.ts` (idioma por defecto `es`, `suggestion`, `dismissSuggestion`), tarjeta `layout/language-suggestion` (carga diferida, mismo estilo que la invitación a instalar), tests |
| B-02 | ✅ Completada · pendiente de publicar | 27-10-2026 | `public/robots.txt`, `public/sitemap.xml` (5 URL), comprobación en `build-production.ts` |
| B-03 | ✅ Parte provisional completada · pendiente de publicar | 27-10-2026 | `features/not-found` + `noindex`; el 404 real llega con B-10 |
| B-04 | ✅ Completada · pendiente de publicar | 27-10-2026 | `workers_dev: false`; `DEPLOYMENT.md` actualizado |
| B-05 | ✅ Parte provisional (JS) completada · pendiente de publicar | 27-10-2026 | `core/seo/seo-tags.ts` + tests; pasa al HTML con B-10 |
| B-14 | ✅ Completada · pendiente de publicar | 27-10-2026 | `public/_headers`; comprobado con el Worker local |

Comprobado en local (27-10-2026), con `wrangler dev` y la build de producción:
- 222 tests, lint y build con sus comprobaciones en verde; el bundle inicial queda en 698 kB.
- Chrome con el navegador en inglés renderiza en español, con el aviso «Read in English».
- Canonical sin parámetros, y `noindex` en URLs inexistentes.
- Lighthouse en local: portada accesibilidad 100 y SEO 100; 404 accesibilidad 100 (SEO 63 solo por el `noindex`, como se busca).
- Capturas a 390 px y 1440 px sin desbordes.

Tras publicar, repetir las comprobaciones de cada tarea en `https://lanzamet.com`.

---

### B-01a · El idioma por defecto de cada URL es el español · P0 · S · — · ✅ Completada (27-10-2026, pendiente de publicar)

- **Por qué**: T-01. Hoy Google probablemente indexa la versión inglesa porque el idioma sale de `navigator.languages`.
- **Archivos**: `src/app/core/i18n/i18n.store.ts`, `src/app/core/i18n/i18n.spec.ts`, mensajes `es.ts`/`en.ts`, un componente pequeño de sugerencia (p. ej. `layout/language-suggestion`).
- **Cambio**: el idioma inicial es la elección guardada o, si no hay, `DEFAULT_LANG` (`es`). `detectLang()` deja de decidir el idioma y solo decide si se muestra una sugerencia discreta y descartable («Read in English»), que al pulsarse llama a `I18n.use('en')`. La sugerencia no toma el foco ni tapa contenido (WCAG 2.2: sin trampas de foco).
- **Efecto en la experiencia**: un visitante nuevo con el navegador en inglés verá primero español, con un botón para cambiar. **Decisión de producto**: confirmar antes de implementarlo. Es la solución provisional hasta B-18 (`/en/`).
- **Criterios de aceptación**: Chrome headless con `--lang=en-US` y sin almacenamiento renderiza `/` con `<html lang="es">` y title en español; con `lm.lang = "en"` guardado, en inglés.
- **Pruebas**: test unitario del store (sin preferencia → `es`; con preferencia → la guardada); repetir el comando de volcado del DOM de `13-limitaciones.md` §3.

### B-02 · `robots.txt` y `sitemap.xml` reales · P0 · S · — · ✅ Completada (27-10-2026, pendiente de publicar)

- **Archivos**: `public/robots.txt` (nuevo); sitemap: `public/sitemap.xml` estático ahora, y generado en build (`scripts/build-production.ts` o un script nuevo) cuando existan las URLs por zona.
- **Cambio**:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/

  Sitemap: https://lanzamet.com/sitemap.xml
  ```
  Sitemap con `/`, `/zonas`, `/mar`, `/donde-ir`, `/legal` (y las nuevas cuando existan). `lastmod` = fecha de cambio del contenido estable, no la del build.
- **Cabeceras**: `public/_headers` → `Content-Type: text/plain; charset=utf-8` para `/robots.txt` y `application/xml` para `/sitemap.xml` si Cloudflare no los infiere.
- **Aceptación**: `curl -I https://lanzamet.com/robots.txt` → 200 `text/plain`; `curl -I …/sitemap.xml` → 200 XML válido; Lighthouse SEO sin el fallo `robots-txt`; Search Console acepta el sitemap.
- **Ojo**: `ngsw-config.json` no debe cachear ni servir el HTML en esas rutas (comprobar `navigationUrls`).

### B-03 · 404 real para URLs inexistentes · P0 · S (provisional) / M (definitivo) · B-10 para el definitivo · ✅ Provisional completada (27-10-2026, pendiente de publicar); definitiva pendiente de B-10

- **Provisional (sin prerender)**: componente `features/not-found/not-found.page.ts` con mensaje y enlaces a las 4 secciones; ruta `**` → ese componente (en lugar de `redirectTo: ''`); en ella, `Meta.updateTag({ name: 'robots', content: 'noindex' })` y retirarlo al salir. Es la alternativa que Google acepta para SPAs ([JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)).
- **Definitivo (con B-10)**: prerenderizar `404.html` y `wrangler.jsonc` → `"not_found_handling": "404-page"`.
- **Archivos**: `src/app/app.routes.ts`, componente nuevo, mensajes, `wrangler.jsonc` (definitivo).
- **Aceptación**: provisional: la URL inventada renderiza «Página no encontrada» con `noindex` en el DOM renderizado. Definitivo: `curl -o /dev/null -w '%{http_code}' https://lanzamet.com/no-existe` → 404; las rutas válidas siguen en 200.

### B-04 · Cerrar el host duplicado `*.workers.dev` · P0 · S · — · ✅ Completada con la opción 1 (27-10-2026, pendiente de publicar)

- **Opción 1**: `wrangler.jsonc` → `"workers_dev": false` (se pierde la dirección de reserva).
- **Opción 2** (conserva la reserva para el API): en `server/api.ts` no se puede, porque el Worker solo corre en `/api/*`. Habría que añadir `run_worker_first` para HTML en ese host, lo que cuesta peticiones. **Se recomienda la opción 1** y actualizar `DEPLOYMENT.md` §5.7.
- **Aceptación**: `curl -I https://lanzamet.lanzamet.workers.dev/` → no 200 con la web.

### B-05 · Canonical por ruta · P0 · S (con JS) · — · ✅ Parte con JS completada (27-10-2026, pendiente de publicar); en HTML con B-10

- **Ahora**: un servicio `SeoService` (`@Service()`) que, en cada `NavigationEnd`, pone `<link rel="canonical" href="https://lanzamet.com{ruta sin query}">`, usando `DOCUMENT` (sin manipular el DOM fuera de Angular más de lo imprescindible). Base URL desde `PUBLIC_URL` (ya existe en el build, `core/share/share-config.ts`).
- **Con B-10**: el canonical viene ya en el HTML prerenderizado y el servicio solo lo mantiene en navegaciones internas, **con el mismo valor**.
- **Aceptación**: el DOM renderizado de cada ruta tiene exactamente un canonical absoluto, sin parámetros.

### B-06 · Search Console y Bing Webmaster Tools · P0 · S · B-02

- Sin código: verificar el **dominio** en Search Console por registro DNS TXT en Cloudflare. Enviar el sitemap. Inspeccionar `/`, `/mar` y `/zonas` y guardar captura del HTML renderizado (para confirmar T-01). Repetir en Bing Webmaster Tools (permite importar desde Search Console).
- Revisar en Search Console la opción «Search generative AI» (incluido por defecto).
- **Aceptación**: propiedad verificada; sitemap «Correcto»; capturas guardadas en `docs/seo-audit/` (añadiendo archivos nuevos, sin sobrescribir).

---

## P1 · Alto impacto

### B-07 · Title, description y H1 por ruta · P1 · M · B-05

- **Archivos**: `src/app/app.routes.ts` (añadir `data: { description: 'route.x.description' }`), `core/i18n/i18n-title.strategy.ts` (o el `SeoService` de B-05) para poner también la description, `i18n.store.ts:40-42` (dejar de pisar la description global), mensajes ES/EN, `features/today/today-hero/today-hero.html` (veredicto `<h1>` → `<p>`, nuevo H1), `features/sea/sea.page.html:31-50` (ídem), `features/plans/plans.page.ts` (H1 con «en Lanzarote»).
- **Textos**: `06-seo-onpage.md` §1-3.
- **Diseño**: el veredicto conserva clases y estilo; el nuevo H1 ocupa la línea «En Lanzarote» existente. **Validar visualmente** a 390, 820 y 1440 px (las anchuras del README) y comprobar que el desplazamiento de layout sigue en 0.
- **Aceptación**: cada ruta tiene un title y una description propios y un solo H1, estable y con «Lanzarote»; AXE sin errores; Lighthouse accesibilidad 100.

### B-08 · Open Graph, Twitter Cards e imágenes sociales · P1 · S · B-07

- **Archivos**: `SeoService`, `public/og/*.png` (1200×630, sin datos del día), mensajes.
- **Cambio**: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:site_name`, `og:locale`, `twitter:card`. **Hasta B-10 solo funciona para clientes que ejecutan JS** (casi ninguna red social): el efecto real llega con el prerender.
- **Compartir**: `core/share/share-config.ts` → `shareLink()` devuelve la URL de la página o la zona actual (con B-11), no solo la raíz.
- **Aceptación**: con B-10, el depurador de Facebook y la vista previa de WhatsApp muestran título e imagen por página.

### B-09 · Datos estructurados base · P1 · S · B-10 (en HTML), puede adelantarse con JS

- **Archivos**: `SeoService` (inserta y actualiza un único `<script type="application/ld+json" id="ld-json">`), `scripts/build-production.ts` (permitir ese tipo en la comprobación de «sin scripts en línea»).
- **Contenido**: `06-seo-onpage.md` §5. Generar `Place` desde `LOCATIONS`.
- **Aceptación**: Rich Results Test y validator.schema.org sin errores; la CSP no muestra avisos en la consola.

### B-10 · Prerender (SSG) con `@angular/ssr` · P1 · L · B-01a

- **Archivos**: `angular.json` (`outputMode: "static"`, `server`, `ssr`), `src/main.server.ts`, `src/app/app.config.server.ts` (`provideServerRendering(withRoutes(serverRoutes))`), `src/app/app.routes.server.ts` (`RenderMode.Prerender` en todas; `getPrerenderParams` para las zonas), `src/app/app.config.ts` (`provideClientHydration()`), stores que leen `localStorage`/`navigator`/`window`/`new Date()` en la construcción (`i18n.store.ts`, `locations.store.ts`, `theme.store.ts`, `clock.store.ts`, `core/pwa/*`, `core/utils/storage.ts`), escena (`shared/scene`), `ngsw-config.json` (fallback de navegación), `wrangler.jsonc` (`not_found_handling: "404-page"`), `scripts/build-production.ts` (comprobaciones en todos los HTML).
- **Pasos**:
  1. `ng add @angular/ssr` en una rama; elegir salida estática.
  2. Hacer seguros para servidor los accesos a APIs del navegador (`isPlatformBrowser`, `afterNextRender`), sin cambiar el comportamiento en el navegador.
  3. Prerenderizar solo lo estable; los bloques de datos muestran su esqueleto en el servidor.
  4. Fallback CSR del service worker para navegaciones sin red (ver `07` §4.1).
  5. `404.html`.
- **Aceptación**:
  - `curl https://lanzamet.com/mar` contiene el H1, la intro, el title, la description, el canonical y el JSON-LD de Mar.
  - Sin errores de hidratación (NG05xx) en la consola en las rutas, en ES y EN, con y sin preferencias guardadas.
  - Sin conexión (app instalada) se abre `/mar` sin errores.
  - Lighthouse móvil `/`: CLS ≤ 0,1, LCP medido antes y después (anotar los dos).
  - Tests y lint en verde; `deploy:check` correcto.
- **Riesgos**: hidratación con estado local (mitigado por idioma y zona en URL), tamaño del build, tiempo de build. Cloudflare sirve `/mar` desde `mar/index.html` o `mar.html` según `html_handling`: **comprobar** que no se introduce una redirección con barra final.

### B-11 · URLs por zona: `/tiempo/{zona}` y `/mar/{zona}` · P1 · L · B-07, B-10 (recomendado)

- **Archivos**: `app.routes.ts` (`tiempo/:zona`, `mar/:zona`, con `withComponentInputBinding()` o lectura del parámetro), `features/today/today.page.ts`, `features/sea/sea.page.ts`, `core/state/locations.store.ts` (la URL manda al entrar; se sigue guardando la elección), `layout/location-picker/location-picker.html` (botones → `<a [routerLink]>` con el mismo aspecto, a la vista actual), `features/zones/zones.page.html` y `island-map.html` (tarjetas y puntos → enlaces), `features/plans/plan-card/*` (enlace a la zona), mensajes (intro y «Sobre esta zona» ×9 en ES y EN; ver `08` §3), `SeoService` (title, description y JSON-LD por zona), sitemap.
- **Reglas**: slug desconocido → 404 (B-03). `RETIRED_LOCATIONS` (`papagayo`) → redirección a `/tiempo/playa-blanca`. `/` sigue mostrando la zona guardada o la de por defecto, con su title de isla.
- **Aceptación**: las 18 URL responden 200 con title, H1 y texto propios; el selector, las tarjetas y el mapa son enlaces `<a href>` (comprobado en el DOM renderizado); la navegación por teclado y el foco funcionan igual que antes; el atrás del navegador funciona.

### B-12 · Página `/viento` · P1 · M · B-07

- **Archivos**: `features/wind/wind.page.ts` (nueva, diferida), `app.routes.ts`, `features/today/conditions/conditions.html:7` (la fila de viento pasa a `<a routerLink="/viento">`; el acceso a las 24 h se conserva con el título de la tira de horas o un enlace secundario), reutilizar `IslandMap`, `HourTimeline`, `WindGauge`, `core/insights/wind.insight.ts`, mensajes.
- **Contenido**: `05-arquitectura-seo.md` §4.7.
- **Aceptación**: `/viento` lista el viento y las rachas de las 9 zonas, ordena «dónde hay menos viento» y explica la escala; sin pestaña nueva en el menú; AXE limpio.

### B-13 · Página `/sobre` e identidad del titular · P1 · S · —

- **Archivos**: `features/about/about.page.ts` (nueva), `app.routes.ts`, enlaces desde `layout/settings-panel/settings-panel.html`, `features/legal/legal.page.html` y pies; mensajes.
- **Contenido**: quién lo hace, por qué, metodología (README §Fuentes, §Puntos de consulta, §Mareas), límites, contacto. El nombre del titular o la entidad lo decide el responsable (E-01; revisar la LSSI con asesoría).
- **Aceptación**: página indexable, enlazada desde Legal y Ajustes, con fecha de revisión.

### B-14 · Caché inmutable para archivos con hash · P1 (barato) · S · — · ✅ Completada (27-10-2026, pendiente de publicar)

- **Archivo**: `public/_headers`.
  ```
  /main-*
    Cache-Control: public, max-age=31536000, immutable
  /chunk-*
    Cache-Control: public, max-age=31536000, immutable
  /styles-*
    Cache-Control: public, max-age=31536000, immutable
  /polyfills-*
    Cache-Control: public, max-age=31536000, immutable
  /media/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- **Verificar** que los nombres reales del build coinciden con estos prefijos y que ninguna regla alcanza a `ngsw-worker.js`, `ngsw.json`, `safety-worker.js`, `install-prompt.js`, `manifest.webmanifest` ni `index.html`.
- **Aceptación**: `curl -I` de un chunk → `immutable`; un despliegue nuevo sigue llegando a las copias instaladas (lista de `DEPLOYMENT.md` §6).

### B-15 · Enlazado interno contextual · P1 · M · B-11, B-12

- **Archivos**: según `05-arquitectura-seo.md` §5.
- **Aceptación**: ninguna página indexable queda a más de 2 clics de `/`; todas las URL del sitemap reciben al menos un enlace interno `<a href>` (comprobar con un rastreo del DOM renderizado).

---

## P2 · Optimización y crecimiento

| Id | Tarea | Esf. | Depende | Archivos | Aceptación |
|---|---|---|---|---|---|
| B-16 | Página `/calima` (dato CAMS de `forecast` de polvo, umbral explicado, avisos, qué es) | M | B-10 | `features/calima/*`, `core/insights/sky.insight.ts`, rutas, mensajes | Muestra el estado actual y los próximos días con fuente; consejos de salud solo enlazados a la autoridad |
| B-17 | Página `/avisos` (avisos activos, niveles, «sin avisos» con hora) | M | B-10 | `features/warnings/*`, `core/state/official.store.ts`, `shared/ui/warning-banner` (enlace) | Refleja `/api/avisos`; enlace a AEMET; estado vacío claro |
| B-18 | Inglés en `/en/…` con `hreflang` | L | B-10, B-11 | rutas (prefijo `en`), `I18n` (el idioma sale de la URL), selector de idioma (navega a la URL equivalente), `SeoService`, sitemap | `09` §A.6 |
| B-19 | `/clima/{mes}` ES y EN con normales reales | L | B-10; fuente verificada | Script de build que descarga y fija los datos (AEMET OpenData normales o Open-Meteo Historical), `features/climate/*` | Cada cifra con fuente y periodo; sin datos inventados |
| B-20 | Guías: viento en Lanzarote; cómo leemos la marea | M | B-10 | `features/guides/*`, mensajes | Fecha de revisión; enlazadas desde `/viento` y `/mar` |
| B-21 | Temperatura del agua: H2 y ancla `#temperatura-agua` en `/mar` y `/mar/{zona}` | S | B-07 | `sea.page.html` | El H2 existe y el ancla funciona |
| B-22 | Sección «El mar entre Órzola y La Graciosa» en `/mar/orzola` | S | B-11 | mensajes, `sea.page.html` | Aclara el punto del modelo y su límite |
| B-23 | Paneles sin contenido en el DOM hasta abrirse (menos encabezados repetidos y nodos) | M | — | `app.html`, `layout/location-picker`, `day-picker`, `settings-panel`, `shared/ui/sheet` | Cada página tiene solo sus encabezados; foco y animaciones intactos |
| B-24 | Rendimiento: `dom-size` de Zonas, `forced-reflow`, TBT, precarga de fuente | M | — | `07` §5 | TBT móvil < 200 ms en laboratorio; DOM de `/zonas` < 1 500 |
| B-25 | Cloudflare Crawler Hints (IndexNow) | S | B-02 | Panel de Cloudflare (sin código) | Activado; Bing Webmaster muestra URLs enviadas |
| B-26 | `noindex, follow` en `/mejorar` | S | B-05 | `SeoService`, rutas | Meta presente |
| B-27 | Enlaces y menciones (sin código) | — | B-11 | `12` §4 | Lista de contactos y resultado |

## P3 · Experimentales

| Id | Tarea | Notas |
|---|---|---|
| B-28 | Alemán parcial (`/de/`, `/de/klima/{monat}`, `/de/meer`, `/de/calima`) | Solo con datos de Search Console de EN y traducción revisada |
| B-29 | Frase del dato del día inyectada en el borde (HTMLRewriter) o SSR en el borde | Medir CPU; el plan gratuito da 10 ms por petición |
| B-30 | `llms.txt` | Google lo ignora; coste mínimo |
| B-31 | Previsión a 14-16 días | Open-Meteo lo permite; decisión de producto y de honestidad (incertidumbre) |
| B-32 | Datos abiertos / `Dataset` | Licencias de las fuentes |
| B-33 | HSTS | Cuando el dominio sea definitivo |
| B-34 | Imagen del logo en AVIF/WebP | Ahorro de 53-65 KiB |
| B-35 | Medición RUM propia sin cookies | Contradice la promesa actual de Legal; decisión del responsable |
