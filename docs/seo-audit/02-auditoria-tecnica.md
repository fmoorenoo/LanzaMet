# 02 · Auditoría técnica SEO

Fecha de la auditoría: 27-10-2026. Web publicada: <https://lanzamet.com> (en línea desde el 24-10-2026). Commit analizado: `9e88bd3` (rama `main`, árbol limpio).

Cada hallazgo indica su **nivel de evidencia**:

- **Verificado**: comprobado con una petición real a la web publicada o leyendo el código.
- **Inferencia**: deducido de evidencias verificadas y de la documentación oficial, pero no observado directamente en Google.
- **Hipótesis**: plausible; necesita datos que no tenemos (Search Console, rankings).

Los identificadores (T-xx, O-xx…) se usan en el plan (`10`), el checklist (`11`) y el backlog (`14`).

---

## 1. Inventario real del proyecto

### 1.1 Stack y despliegue (verificado)

| Aspecto | Valor | Fuente |
|---|---|---|
| Framework | Angular 22.2, componentes standalone, signals, `@angular/build:application` | `package.json`, `angular.json` |
| Renderizado | **CSR puro** (SPA). No hay `@angular/ssr`, ni prerender, ni hidratación | `angular.json` (sin `server`/`prerender`/`outputMode`), `src/main.ts` |
| Hosting | Un Worker de Cloudflare (`lanzamet`) sirve los estáticos y `/api/*` | `wrangler.jsonc` |
| Rutas desconocidas | `not_found_handling: "single-page-application"`: toda ruta sin archivo devuelve `index.html` con 200 | `wrangler.jsonc:12` |
| Código del Worker | Solo para `/api/*` (`run_worker_first: ["/api/*"]`) | `wrangler.jsonc:14` |
| PWA | Service worker de Angular (`ngsw-config.json`), manifest en `public/manifest.webmanifest` | |
| Idiomas | `es` y `en`, elegidos en el navegador (preferencias o Ajustes), **misma URL** | `src/app/core/i18n/i18n.store.ts` |
| Analítica | Ninguna, a propósito («sin analítica ni seguimiento») | `legal.privacy.summary` en `messages/es.ts` |
| Dominios | `lanzamet.com` (canónico de hecho), `www` → 301 a la raíz, `http` → 301 a `https`, **`lanzamet.lanzamet.workers.dev` sirve la web entera con 200** | curl, ver §2.4 |

### 1.2 Rutas (verificado: `src/app/app.routes.ts`)

| URL | Título renderizado (ES) | Carga | En el menú | Función |
|---|---|---|---|---|
| `/` | Hoy en Lanzarote · LanzaMet | inicial | Sí (Hoy) | Escena, ahora, 24 h, dónde ir, detalle, 7 días, avisos |
| `/zonas` | Zonas · LanzaMet | diferida | Sí (Zonas) | Mapa ilustrado y tarjetas de las 9 zonas |
| `/mar` | Mar y mareas · LanzaMet | diferida | Sí (Mar) | Marea estimada, pleamares/bajamares hoy y mañana, oleaje, mar de fondo, agua, zonas más tranquilas |
| `/donde-ir` | ¿Dónde ir hoy? · LanzaMet | diferida | Sí (Dónde ir) | Planes recomendados por zona |
| `/mejorar` | Ayúdanos · LanzaMet | diferida | No (desde Ajustes) | Formulario de comentarios |
| `/legal` | Legal y privacidad · LanzaMet | diferida | No (desde Ajustes) | Privacidad, condiciones, fuentes, contacto |
| `/**` | → redirige a `/` en el cliente | | | |

No existen URLs por localidad, por día, por idioma ni por tema. La zona elegida (9 posibles) se guarda en `localStorage` (`src/app/core/state/locations.store.ts:56`) y el día elegido es un signal en memoria (`src/app/core/state/day.store.ts:20`).

### 1.3 Funcionalidades con valor SEO (verificado en código y en el DOM renderizado)

| Funcionalidad | Dónde | Datos | Hoy es indexable… |
|---|---|---|---|
| Tiempo actual y veredicto en palabras | Hoy (`today-hero`) | Open-Meteo (DWD ICON) | Solo para la zona por defecto (Puerto del Carmen) |
| 24 horas con viento por hora | Hoy (`hour-timeline`) | Open-Meteo | Ídem |
| 7 días | Hoy (`day-list`) | Open-Meteo, `forecast_days: 7` (`open-meteo.client.ts:158`) | Ídem |
| Viento: velocidad, rachas, dirección, Beaufort agrupado, alisio | Hoy, Zonas | Open-Meteo | Sin página propia |
| Oleaje, periodo, mar de fondo, temperatura del agua | Mar | Météo-France MFWAM vía Open-Meteo | Solo zona por defecto |
| Marea estimada (pleamar/bajamar hoy y mañana) | Mar (`tide-chart`) | SMOC (estimación, no oficial) | Solo zona por defecto |
| Calima (polvo en superficie) | Escena, veredicto | CAMS | Sin página propia |
| Avisos oficiales AEMET (Lanzarote y costa) | Hoy (`warning-banner`), Mar | AEMET CAP/RSS vía `/api/avisos` | Solo cuando hay aviso, sin URL propia |
| Observaciones de 7 estaciones AEMET | Hoy («Medido») | `/api/observaciones` | Sin página propia |
| Amanecer/atardecer y recorrido del sol | Hoy (`sun-path`) | Open-Meteo | Ídem |
| Comparativa de 9 zonas (mapa) | Zonas | Open-Meteo | Sí, en `/zonas` |
| Recomendaciones «Dónde ir» | Dónde ir | Reglas propias (`core/insights`) | Sí, en `/donde-ir` |
| Webcams (7 zonas, enlaces salientes) | Zonas, Dónde ir, Hoy | `core/data/webcams.ts` | Enlaces externos |
| Compartir el tiempo (imagen generada en el dispositivo) | Hoy (`share-weather`) | Canvas | El enlace compartido es siempre la raíz (`core/share/share-config.ts`) |
| Selector de día (hoy + 6) | Hoy, Zonas, Mar | | Sin URL |

**Conclusión del inventario**: Lanzamet tiene más datos útiles y diferenciados que muchas webs que posicionan (comparativa por zonas, mar por zona con celda elegida a mano, avisos AEMET filtrados, explicación en palabras), pero los expone en **4 URLs con contenido personalizado por `localStorage`**. Para Google, la web es una sola página de Puerto del Carmen, tres vistas más y dos páginas de servicio.

---

## 2. Rastreo e indexación

### T-01 · El idioma cambia en la misma URL según el navegador · **P0** · Verificado (confirmado con Search Console el 27-10-2026; corregido con B-01a)

- **Evidencia**: renderizando con Chrome headless y `--lang=en-US` (con el user agent de Googlebot Smartphone), todas las rutas salen en inglés: `<html lang="en">`, título «Today in Lanzarote · LanzaMet», descripción en inglés, todos los textos en inglés. Con `--lang=es-ES` sale en español. El HTML inicial dice `lang="es"`.
- **Código**: `src/app/core/i18n/i18n.store.ts:30-32` toma `navigator.languages` si no hay elección guardada; `effect()` reescribe `lang` y la meta description.
- **Documentación oficial**: Google indica que Googlebot rastrea sobre todo desde IP de EE. UU. y **sin cabecera `Accept-Language`**, y recomienda URLs separadas por idioma con `hreflang` ([Locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages), actualizada 10-12-2025).
- **Inferencia**: Google no documenta el valor de `navigator.languages` de su renderizador. Si es inglés (lo habitual en un Chrome sin configurar en EE. UU.), Google **indexa la versión inglesa** de una web pensada para búsquedas en español, con títulos como «Places · LanzaMet», y no puede indexar nunca las dos versiones.
- **Impacto**: alto. Afecta a todas las keywords en español («tiempo en Lanzarote», «mareas Lanzarote»…) y a la vez impide posicionar en inglés de forma limpia.
- **Comprobación necesaria**: Search Console → Inspección de URL → «Probar URL publicada» → captura y HTML renderizado. Ver `13-limitaciones.md`.
- **Corrección propuesta**: idioma por URL (español en la raíz, inglés en `/en/…`), `hreflang` recíproco y `x-default`; la detección del navegador solo puede **sugerir** el cambio (aviso discreto), nunca cambiar el contenido de una URL. Tareas `B-01a` (provisional: español por defecto, P0) y `B-18` (`/en/` con `hreflang`) en `14-backlog-seo.md`.

### T-02 · No existen `robots.txt` ni `sitemap.xml` · **P0** · Verificado

- **Evidencia**: `GET /robots.txt`, `/sitemap.xml` y `/llms.txt` → `200`, `Content-Type: text/html`, 1 676 bytes: es `index.html` (mismo ETag `eb39a475…`).
- **Causa**: `public/` no contiene esos archivos y el Worker sirve `index.html` para cualquier ruta (`not_found_handling: "single-page-application"`).
- **Impacto**: Google interpreta las líneas no válidas de un robots.txt como ignorables, así que **no bloquea nada** (inferencia de la especificación RFC 9309). El problema real es la ausencia de sitemap y la falta de control (p. ej. sobre `/api/`).
- **Corrección**: `public/robots.txt` y un sitemap generado en build. Tarea `B-02`.

### T-03 · Soft 404 en cualquier URL inexistente · **P0** · Verificado

- **Evidencia**: `GET /no-existe-xyz` → `200` con `index.html`; en el cliente, `{ path: '**', redirectTo: '' }` (`app.routes.ts:41`) muestra la portada en esa URL.
- **Documentación oficial**: para SPAs, Google pide devolver un 404 real o añadir `noindex` a la vista de error ([JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), 04-03-2026).
- **Impacto**: medio-alto. Cualquier enlace roto externo o URL inventada crea un duplicado de la portada; Search Console lo marcará como soft 404 o como duplicado.
- **Corrección**: componente `NotFound` con `noindex` y, al pasar a prerender (R-01), `404.html` servido con estado 404. Tarea `B-03`.

### T-04 · Host duplicado `lanzamet.lanzamet.workers.dev` · **P0** · Verificado

- **Evidencia**: `GET https://lanzamet.lanzamet.workers.dev/` → `200`, mismo ETag que `lanzamet.com`. `wrangler.jsonc:26` → `"workers_dev": true`.
- **Impacto**: si alguien enlaza o Google descubre ese host, hay dos copias idénticas sin `canonical` que diga cuál es la buena.
- **Corrección**: `"workers_dev": false` (si no se necesita la reserva) o 301 desde el Worker a `https://lanzamet.com` para peticiones de HTML en ese host, más `canonical` absoluto. Tarea `B-04`.

### T-05 · Ninguna página tiene `rel="canonical"` · **P0** · Verificado

- **Evidencia**: ni el HTML inicial ni el DOM renderizado de las 6 rutas contienen `rel="canonical"`.
- **Impacto**: con parámetros (`?escenario=` solo existe en demo; `?utm_…` al compartir), host duplicado y, en el futuro, URLs por zona/idioma, Google debe adivinar la URL canónica.
- **Corrección**: canonical absoluto por ruta **en el HTML servido** (Google recomienda ponerlo en HTML; si se pone con JS, que coincida). Tarea `B-05`.

### T-06 · El HTML servido no contiene contenido · **P1** · Verificado

- **Evidencia**: el `<body>` servido es solo `<lm-root></lm-root>` y scripts. Título y descripción son los mismos para todas las rutas en el HTML inicial («LanzaMet · El tiempo y el mar en Lanzarote»).
- **Google**: renderiza JavaScript; en nuestra prueba con Chrome headless el contenido aparece completo (875-955 palabras por página). **No bloquea la indexación en Google**, pero la retrasa (cola de renderizado) y deja el título por ruta en manos del JS.
- **Rastreadores de IA y redes sociales**: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, CCBot y Bingbot reciben `200` y **1 676 bytes sin contenido** (probado con su user agent; no se probaron sus IP reales). Los que no ejecutan JavaScript (la mayoría, según su documentación pública; inferencia) no ven nada de Lanzamet. WhatsApp, Telegram, X o Facebook tampoco ven título ni imagen por ruta.
- **Corrección**: prerender (SSG) de las rutas con `@angular/ssr`, compatible con el plan gratuito de Workers. Ver `07-javascript-rendimiento.md` y tarea `B-10`.

### T-07 · Las zonas no son rastreables · **P1** · Verificado

- El selector de zona usa `<button>` y `localStorage`; no hay ningún `<a href>` a una zona. Google solo descubre enlaces `<a href>` ([JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)).
- Resultado: las 9 localidades (Famara, Playa Blanca, Órzola…) no tienen URL indexable, aunque el producto ya tiene datos propios para cada una. Ver `05-arquitectura-seo.md`.

### T-08 · Profundidad, enlaces internos y huérfanas · Verificado

| Página | Enlazada desde | Profundidad |
|---|---|---|
| `/`, `/zonas`, `/mar`, `/donde-ir` | Menú (todas las páginas) | 1 |
| `/mejorar`, `/legal` | Panel de Ajustes (en el DOM aunque cerrado) y Legal → Ayúdanos | 1 |

- No hay huérfanas ni enlaces rotos internos (todos los `href` internos responden 200).
- Enlaces contextuales escasos: Hoy → `/mar` (filas mar y marea) y → `/donde-ir`; la fila de viento es un `<button>` (`features/today/conditions/conditions.html:7`).
- Enlaces externos: Open-Meteo, CC BY, AEMET, OpenStreetMap, Web3Forms y webcams, con `target="_blank" rel="noopener"`. Correcto.

### T-09 · Redirecciones, HTTPS y dominio preferido · Verificado ✅

- `http://lanzamet.com/` → 301 → `https://lanzamet.com/`.
- `https://www.lanzamet.com/mar` → 301 → `https://lanzamet.com/mar` (conserva la ruta).
- Sin cadenas de redirección. TLS de Cloudflare, HTTP/3 anunciado (`alt-svc`).
- **Sin HSTS** (`DEPLOYMENT.md` §5.5 lo deja opcional). Recomendación P3: activarlo cuando el dominio sea definitivo (no afecta al ranking; mejora la seguridad).

### T-10 · Códigos de estado del API · Verificado

- `/api/salud` → 200 JSON, `no-store`. El API solo atiende rutas fijas (`server/api.ts:194-219`).
- ~~`/api/*` no debería rastrearse: incluir `Disallow: /api/` en robots.txt.~~ **Corregido el 27-10-2026**: `/api/` debe quedar **abierto**. Google lo llama al renderizar las páginas, y el plan B (Open-Meteo directo) prohíbe todos los rastreadores en su robots.txt. Con `/api/` bloqueado, la Inspección de URL mostró las páginas sin datos. Google no indexa JSON como páginas, así que dejarlo abierto no tiene coste SEO.

---

## 3. SEO on-page (resumen; detalle en `06-seo-onpage.md`)

Datos del DOM renderizado en español e inglés (verificado):

| Ruta | `<title>` (ES) | `meta description` | H1 renderizado |
|---|---|---|---|
| `/` | Hoy en Lanzarote · LanzaMet | Genérica, **igual en todas** | «Amanece nublado» (veredicto que cambia cada hora) |
| `/zonas` | Zonas · LanzaMet | Igual | «Lanzarote, zona a zona» |
| `/mar` | Mar y mareas · LanzaMet | Igual | «Marea baja ahora» (cambia) |
| `/donde-ir` | ¿Dónde ir hoy? · LanzaMet | Igual | «¿Dónde ir hoy?» |
| `/legal` | Legal y privacidad · LanzaMet | Igual | «Legal y privacidad» |
| `/mejorar` | Ayúdanos · LanzaMet | Igual | «Ayúdanos» |

- **O-01 · P1**: ningún título contiene «tiempo», «mareas» o «viento» junto a «Lanzarote», salvo de forma parcial «Hoy en Lanzarote». La descripción es la misma en las 6 rutas (`i18n.store.ts:40-42` solo la cambia por idioma).
- **O-02 · P1**: el H1 de Hoy y de Mar es una frase dinámica sin entidad ni keyword; en Hoy, además, un H2 («Compartir el tiempo», de la hoja de compartir) aparece **antes** del H1 en el DOM.
- **O-03 · P2**: los paneles (Elige zona, ¿Qué día quieres ver?, Ajustes) están siempre en el DOM con sus H2/H3 en todas las páginas: 7 encabezados repetidos que diluyen la jerarquía.
- **O-04 · P1**: sin Open Graph ni Twitter Cards (verificado). Al compartir el enlace en WhatsApp no hay imagen ni título por página.

## 4. Datos estructurados

- **S-00 · Verificado**: 0 bloques JSON-LD, sin microdatos.
- Google no tiene resultado enriquecido específico para el tiempo. Lo útil: `WebSite` + `Organization` (entidad y logo), `WebPage` con `about` → `Place` + `GeoCoordinates` para cada zona, `BreadcrumbList` cuando haya URLs por zona. **`FAQPage` ya no da resultado enriquecido** (retirado para todos los sitios el 7-5-2026 según el registro de cambios de Google); no se recomienda por ese motivo. `Dataset` solo lo usa Dataset Search. Ver `06-seo-onpage.md` §5.

## 5. Rendimiento (resumen; detalle en `07-javascript-rendimiento.md`)

- TTFB del HTML: 160-190 ms desde Madrid (3 muestras; verificado), servido por la caché de Cloudflare (`CF-Cache-Status: HIT`).
- JS inicial: 674 KB sin comprimir / 212 KB con Brotli (`main` + 4 chunks precargados). CSS 19 KB / 5 KB.
- **P-01 · P1 (por su coste mínimo; tarea B-14)**: los archivos con hash (`main-*.js`, `chunk-*.js`, `styles-*.css`) se sirven con `Cache-Control: public, max-age=0, must-revalidate`; cada visita repetida revalida (304) en lugar de usar la caché. El service worker lo compensa en visitas instaladas. Corregible en `public/_headers`.
- Sin datos de campo (CrUX): la web tiene 3 días; PageSpeed Insights sin cuota anónima hoy. Lighthouse local en `07`.

## 6. Accesibilidad con impacto SEO (verificado en el DOM)

- ✅ Skip link, `<main>`, navegación con `<a href>`, `aria-labelledby` por sección, alt vacío en el logo decorativo con `aria-label` en el enlace.
- ⚠️ El H1 cambia con el estado (ver O-02).
- ⚠️ Encabezados de paneles ocultos siempre presentes (O-03).
- El proyecto exige pasar AXE y WCAG AA (`CLAUDE.md`): toda propuesta de este documento debe mantenerlo. Resultados de Lighthouse en `07`.

## 7. Seguridad técnica (verificado)

- CSP estricta (`script-src 'self'`), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `frame-ancestors 'none'`. Muy bien.
- **Implicación para SEO**: el JSON-LD es un `<script type="application/ld+json">` en línea. La CSP con `script-src 'self'` **no bloquea** bloques de datos (no son scripts ejecutables), pero `scripts/build-production.ts` comprueba que `index.html` «no tiene scripts en línea»; esa comprobación tendrá que admitir `application/ld+json`. Ver B-07.
- Rastreadores de IA: no están bloqueados por Cloudflare (200 con su user agent). Ver `09-internacional-geo.md`.

## 8. Mobile-first

- Viewport correcto, diseño adaptado (barra inferior en móvil), mismo contenido en móvil y escritorio (la diferencia es de maquetación, `docs/DESIGN.md`). Sin problemas de paridad. Verificado a 412 px.

## 9. Identidad, fuentes y actualización

- Fuentes y licencias bien citadas en cada pie y en Legal. Marea presentada como estimación (correcto y diferenciador en confianza).
- **E-01 · P1**: no consta quién está detrás de LanzaMet (ni nombre, ni ubicación, ni página «Sobre»). Contacto solo por formulario. Para E-E-A-T (temas que afectan a la seguridad en el mar) y para entidades en buscadores de IA, falta una página de identidad y metodología. Además, la LSSI (Ley 34/2002, art. 10) exige identificar al titular de un servicio de la sociedad de la información; **revisar con asesoría**: no es una conclusión legal.
- «Actualizado a las…» se muestra en el pie (bien). No hay `dateModified` legible por máquinas.

## 10. Comparación código ↔ web publicada

| Comprobación | Código | Publicado | ¿Coinciden? |
|---|---|---|---|
| Rutas | 6 + comodín | 6 responden; cualquier otra → 200 | Sí |
| Título inicial | `index.html:5` | Igual | Sí |
| Idioma | `detectLang(navigator.languages)` | Cambia con `--lang` | Sí |
| Cabeceras | `public/_headers` | Iguales | Sí |
| Service worker | `ngsw-config.json` | `ngsw-worker.js` presente | Sí |
| Build | Hash `main-TI4OWOFL.js` | Mismo patrón | Sí (no se pudo comprobar que el despliegue sea exactamente `9e88bd3`) |
