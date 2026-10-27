# 11 · Checklist maestro

Estado a 27-10-2026. Leyenda: ✅ correcto · ❌ problema verificado · ⚠️ mejorable · ⬜ pendiente (no existe aún) · ❓ no verificable sin acceso · 🟦 corregido en el código, pendiente de publicar.

Primer lote (B-01a, B-02, B-03 provisional, B-04, B-05 con JS, B-14) publicado y comprobado en `https://lanzamet.com` el 27-10-2026: ver «Estado» en `14-backlog-seo.md`.

## Rastreo e indexación

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| HTTPS y redirección http → https (301) | ✅ | curl |
| www → raíz (301, conserva la ruta) | ✅ | curl |
| Host único | ✅ | `workers_dev: false` · B-04 |
| robots.txt | ✅ | `public/robots.txt` (todo abierto, `/api/` incluido; declara el sitemap) · B-02 |
| Recursos de renderizado accesibles para Google | ✅ | `/api/` abierto (corregido el 27-10-2026). Comprobar con la Inspección de URL que la captura muestra datos |
| Search Console | ✅ | Propiedad verificada; inspección de `/`, `/mar` y `/zonas` hecha · B-06 |
| sitemap.xml | ✅ | `public/sitemap.xml` con 5 URL · B-02 |
| 404 reales | ✅ / ⬜ | Provisional: vista «Página no encontrada» con `noindex` · B-03. El estado HTTP 404 llegará con B-10 |
| Canonical | ✅ | Por JS en cada ruta, sin parámetros · B-05. En el HTML, con B-10 |
| Meta robots | ✅ | Ninguna página con `noindex` por error |
| `noindex` en `/mejorar` | ⬜ | B-26 |
| Enlaces `<a href>` en la navegación | ✅ | Menú con `routerLink` |
| Zonas enlazables | ❌ | Botones + `localStorage` · B-11 |
| Páginas huérfanas | ✅ | Ninguna |
| Profundidad ≤ 2 | ✅ | Todo a 1 clic |
| Rastreadores de IA no bloqueados | ✅ | 200 con su user agent (sin probar sus IP) |
| Indexación real en Google | ❓ | Requiere Search Console · B-06 |

## Idioma

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| Idioma estable por URL | ✅ | Siempre español salvo elección guardada; sugerencia «Read in English» · B-01a |
| `<html lang>` correcto en el HTML servido | ✅ | `es` también tras renderizar en un navegador en inglés · B-01a |
| URLs por idioma + hreflang | ⬜ | B-18 |
| Traducción EN completa | ✅ | `en.ts` tipado |
| Alemán | ⬜ | B-28 (P3) |

## Renderizado

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| Contenido en el HTML servido | ❌ | `<lm-root>` vacío · B-10 |
| Contenido tras renderizar | ✅ | 480-955 palabras por ruta |
| Metadatos por ruta en el HTML | ❌ | Solo tras JS · B-10 |
| Errores de JS que impidan renderizar | ✅ | Ninguno en el renderizado headless |
| Lazy loading de rutas | ✅ | `loadComponent` |

## On-page

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| Titles con keyword | ⚠️ | Solo «Hoy en Lanzarote» · B-07 |
| Descriptions únicas | ❌ | Una para todo · B-07 |
| Un H1 estable por página | ❌ | Dinámico en Hoy y Mar · B-07 |
| Orden de encabezados | ⚠️ | H2 antes del H1 en Hoy; 7 encabezados de paneles en todas · B-23 |
| Texto estable explicativo | ⚠️ | Mínimo · B-11, `08` |
| Open Graph / Twitter | ❌ | No hay · B-08 |
| Compartir la URL de la zona | ⚠️ | Siempre la raíz · B-08 |
| Alt de imágenes | ✅ | Logo decorativo con `alt=""` |
| URLs limpias | ✅ | |

## Datos estructurados

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| WebSite + Organization | ⬜ | B-09 |
| WebPage + Place por zona | ⬜ | B-09, B-11 |
| BreadcrumbList | ⬜ | B-11 |
| FAQPage | — | No recomendado (retirado en mayo de 2026) |

## Rendimiento

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| TTFB | ✅ | 50-190 ms |
| LCP móvil (laboratorio) | ⚠️ | 3,9-4,1 s · B-10, B-24 |
| CLS | ✅ | 0 |
| TBT móvil (laboratorio) | ⚠️ | 270-510 ms · B-24 |
| Caché de archivos con hash | ✅ | `max-age=31536000, immutable` en `main-*`, `chunk-*`, `styles-*`, `polyfills-*` y `media/*` · B-14 |
| Compresión | ✅ | Brotli |
| Fuentes | ✅ | Autoalojadas, `swap` (precarga: B-24) |
| Datos de campo (CrUX) | ❓ | Sin tráfico suficiente aún |

## Confianza y contenido

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| Fuentes citadas en cada página | ✅ | `DataCredit` |
| Marea marcada como estimada | ✅ | |
| Página «Sobre» / metodología | ⬜ | B-13 |
| Identidad del titular | ❌ | No consta · B-13 (revisar LSSI) |
| Fecha de actualización visible | ✅ | «Actualizado a las…» (máquina: ⚠️, falta `<time>`) |

## Seguridad y móvil

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| CSP y cabeceras de seguridad | ✅ | `public/_headers` |
| HSTS | ⚠️ | No activado · B-33 |
| Viewport y diseño móvil | ✅ | |
| Paridad móvil/escritorio | ✅ | |
| Accesibilidad (Lighthouse) | ✅ | 100 en `/`, `/mar`, `/zonas` |

## Medición

| Elemento | Estado | Evidencia / tarea |
|---|---|---|
| Google Search Console | ✅ | Verificado el 27-10-2026 · B-06 |
| Bing Webmaster Tools | ❓ | B-06 |
| Analítica | — | Ninguna, por decisión de privacidad |
| IndexNow / Crawler Hints | ⬜ | B-25 |

## Páginas nuevas

| Página | Estado | Tarea |
|---|---|---|
| `/tiempo/{zona}` ×9 | ⬜ | B-11 |
| `/mar/{zona}` ×9 | ⬜ | B-11 |
| `/viento` | ⬜ | B-12 |
| `/sobre` | ⬜ | B-13 |
| `/calima` | ⬜ | B-16 |
| `/avisos` | ⬜ | B-17 |
| `/en/…` | ⬜ | B-18 |
| `/clima/{mes}` | ⬜ | B-19 |
| Guías | ⬜ | B-20 |
