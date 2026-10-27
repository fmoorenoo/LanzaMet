# 01 · Resumen ejecutivo

**Auditoría SEO de <https://lanzamet.com>** · 27-10-2026 · solo lectura: no se ha modificado código, configuración ni servicios. Documentos 02-14 en esta carpeta.

## 1. Diagnóstico en una frase

Lanzamet tiene **mejor producto que muchas webs que posicionan** (el día explicado en palabras, zona a zona, con viento, mar, marea, calima y avisos, sin anuncios y con accesibilidad 100 en Lighthouse). Pero **para un buscador es casi invisible**: 4 URLs útiles, el contenido solo existe tras ejecutar JavaScript, las 9 localidades no tienen URL y el idioma cambia en la misma URL según el navegador.

## 2. Valoración general

Valoración cualitativa. No se da una puntuación SEO numérica: sería una cifra inventada sin datos de Search Console.

| Área | Estado | Comentario |
|---|---|---|
| Producto y datos | **Muy bueno** | Datos propios por zona, explicación en palabras, fuentes citadas, honestidad (marea estimada) |
| Indexabilidad | **Mal** | Sin robots.txt ni sitemap, soft 404, sin canonical, host duplicado, idioma variable |
| Arquitectura | **Mal** | 4 URLs; localidades y temas sin página |
| On-page | **Regular** | Titles sin keywords, una description para todo, H1 dinámico |
| Renderizado (JS) | **Regular** | Google lo renderiza bien; IA y redes no ven nada |
| Rendimiento | **Regular** | Escritorio 96; móvil 65-73 en laboratorio (LCP ~4 s); CLS 0; TTFB excelente |
| Accesibilidad | **Muy bueno** | Lighthouse 100 en las páginas medidas |
| Datos estructurados | **Ausente** | 0 bloques |
| Confianza (E-E-A-T) | **Regular** | Fuentes muy bien citadas; falta quién está detrás y una metodología pública |
| Medición | **Ausente** | Sin Search Console ni analítica (esto último por decisión de privacidad) |

## 3. Fortalezas

1. Datos diferenciales que nadie más presenta así: mar por zona en celdas elegidas a mano, comparativa dentro de la isla, avisos AEMET filtrados, calima.
2. Lenguaje claro («Mar en calma, olas de unos 40 cm, agua a 23 °C»), ideal para responder búsquedas y para la IA.
3. Técnica sólida: Angular 22 moderno, CSP estricta, Cloudflare con TTFB de 50-190 ms, CLS 0, PWA.
4. Traducción inglesa completa y tipada.
5. Sin anuncios ni rastreo: es un argumento frente a la competencia.
6. **Momento ideal**: la web tiene 3 días, así que cambiar URLs hoy casi no cuesta.

## 4. Los 10 problemas más importantes (verificados)

| # | Problema | Prioridad | Tarea |
|---|---|---|---|
| 1 | El idioma cambia en la misma URL según el navegador. Con un navegador en inglés toda la web sale en inglés; Google probablemente indexa esa versión | P0 | B-01a, B-18 |
| 2 | Las 9 localidades no tienen URL (la zona vive en `localStorage`) | P1 | B-11 |
| 3 | El HTML servido está vacío: los bots de IA y las redes no ven contenido, y los metadatos por ruta dependen del JS | P1 | B-10 |
| 4 | `robots.txt` y `sitemap.xml` devuelven el HTML de la app | P0 | B-02 |
| 5 | Soft 404: cualquier URL inventada responde 200 con la portada | P0 | B-03 |
| 6 | Ninguna página tiene canonical | P0 | B-05 |
| 7 | `lanzamet.lanzamet.workers.dev` sirve una copia idéntica | P0 | B-04 |
| 8 | Titles sin «tiempo/mareas/viento», una sola description, H1 dinámico («Amanece nublado») | P1 | B-07 |
| 9 | Sin Open Graph ni JSON-LD; al compartir se envía siempre la raíz | P1 | B-08, B-09 |
| 10 | LCP móvil de ~4 s en laboratorio (texto que depende de JS y datos) y archivos con hash sin caché larga | P1 | B-10, B-14 |

Además: no consta quién está detrás de la web (E-E-A-T; revisar la LSSI con asesoría), B-13.

## 5. Las 10 oportunidades principales

Detalle en `12-oportunidades-crecimiento.md`:

1. Mareas por localidad.
2. Tiempo por localidad.
3. Calima (SERP sin portales grandes).
4. Playas sin viento / dónde ir hoy.
5. Viento hoy.
6. Inglés: clima por mes.
7. Temperatura del agua.
8. Oleaje y estrecho de La Graciosa.
9. «Is Lanzarote windy?».
10. Avisos.

## 6. Arquitectura recomendada (resumen)

Se mantienen el menú, el diseño y las 4 pestañas. Las páginas nuevas reutilizan componentes y se enlazan desde el contenido.

```
/                       El tiempo en Lanzarote hoy           (Hoy)
/zonas                  Tiempo por zonas (mapa)              (Zonas)
/mar                    Mareas y estado del mar              (Mar)
/donde-ir               Playas sin viento / dónde ir hoy     (Dónde ir)
/tiempo/{zona} ×9       Tiempo en Famara, Playa Blanca…      nueva
/mar/{zona} ×9          Mareas y olas en …                   nueva
/viento                 Viento hoy y dónde sopla menos       nueva
/calima  /avisos        Calima hoy · Avisos AEMET            nuevas (P2)
/clima/{mes}            El tiempo en Lanzarote en {mes}      nueva (P2, solo con datos reales)
/guias/…  /sobre        Guías · Metodología e identidad      nuevas
/en/…                   Inglés con hreflang                  (P2)
/de/…                   Alemán parcial                       (P3)
```

Renderizado: **prerender estático (SSG)** con `@angular/ssr`, compatible con el plan gratuito de Cloudflare. Lleva al HTML el contenido estable y los metadatos; el dato vivo se sigue cargando en el navegador. Detalle en `05` y `07`.

## 7. Estrategia para las tres keywords prioritarias

### «Tiempo en Lanzarote»
- **Realidad**: SERP de AEMET, Meteored, eltiempo.es y meteoblue. No es una victoria a corto plazo.
- **Plan**:
  1. Español fijo en `/` (B-01a).
  2. Title «El tiempo en Lanzarote hoy y mañana…» y H1 estable (B-07).
  3. HTML prerenderizado (B-10).
  4. Bloque «El tiempo por zonas» con 9 enlaces (B-11, B-15).
  5. Autoridad construida desde abajo: las páginas de zona y de nicho (calima, viento, mareas) ganan antes y refuerzan la home.

### «Mareas Lanzarote»
- **Realidad**: tablademareas, tideschart y canarias.app, con páginas por localidad. La búsqueda se fragmenta por lugar (Arrieta, Punta Mujeres, Famara, Órzola…).
- **Plan**:
  1. `/mar` como hub con H1 «Mareas y estado del mar en Lanzarote» y H2 «Pleamar y bajamar» (B-07).
  2. `/mar/{zona}` ×9 (B-11).
  3. Transparencia como ventaja: «estimada a partir del modelo SMOC, validada el 22-10-2026», guía de metodología (B-20).
  4. Sin «oficial» ni «tabla para navegar».

### «Viento Lanzarote»
- **Realidad**: Windfinder, windy.app y Windguru dan tablas sin interpretar.
- **Plan**:
  1. `/viento` (B-12) con viento y rachas de las 9 zonas, «dónde hay menos viento hoy», Beaufort en palabras y alisio. La fila de viento de Hoy pasa a enlazar ahí.
  2. Guía «por qué hace viento en Lanzarote» (B-20).
  3. Relación con `/donde-ir` (playas sin viento) sin canibalizar: dato frente a plan.

## 8. Plan por impacto (resumen de `10`)

| Fase | Cuándo | Qué |
|---|---|---|
| 0 | Semana 1 | Search Console y Bing · español por defecto · robots.txt y sitemap · canonical · 404 provisional · cerrar workers.dev · caché inmutable |
| 1 | Semanas 2-5 | Titles/descriptions/H1 · `/sobre` · **prerender** · JSON-LD y OG · **URLs por zona** · `/viento` · enlazado interno |
| 2 | Meses 2-3 | `/en/` · `/calima` · `/avisos` · agua y estrecho · guías · clima mensual · rendimiento · enlaces |
| 3 | Mes 4 en adelante | Decidir con datos: separar `/mareas`, alemán, dato del día en el borde, 14 días |

## 9. Limitaciones

Sin Search Console, ni volúmenes, ni SERP de Google localizadas, ni datos de campo de Core Web Vitals (web de 3 días). El idioma con el que renderiza Google es una inferencia que hay que confirmar con la Inspección de URL. Lista completa en `13-limitaciones.md`.

## 10. Índice de documentos

| Archivo | Contenido |
|---|---|
| `02-auditoria-tecnica.md` | Inventario, rastreo, indexación, on-page, seguridad, con evidencias |
| `03-keyword-research.md` | Keywords ES/EN/DE, clusters, intención, mapa a páginas |
| `04-competidores.md` | Quién compite, fichas, huecos |
| `05-arquitectura-seo.md` | URLs, fichas de página, enlazado, canibalización |
| `06-seo-onpage.md` | Titles, descriptions, H1, JSON-LD, OG |
| `07-javascript-rendimiento.md` | Renderizado, Lighthouse, opciones SSG/SSR |
| `08-estrategia-contenidos.md` | Contenido estable, datos por zona, SEO programático |
| `09-internacional-geo.md` | Multilingüe y buscadores con IA |
| `10-plan-implementacion.md` | Fases, matriz, dependencias, KPIs |
| `11-checklist-maestro.md` | Estado de cada punto |
| `12-oportunidades-crecimiento.md` | Top 10, victorias rápidas, enlaces |
| `13-limitaciones.md` | Lo no verificable y los accesos necesarios |
| `14-backlog-seo.md` | Tareas listas para ejecutar más adelante |
