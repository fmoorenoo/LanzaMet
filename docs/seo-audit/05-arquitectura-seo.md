# 05 · Arquitectura SEO

## 1. Principios

1. **Se conservan el diseño, el menú y la navegación.** El menú sigue con 4 pestañas (Hoy, Zonas, Mar, Dónde ir) apuntando a las mismas URL. Las páginas nuevas reutilizan componentes existentes y se alcanzan con **enlaces contextuales** (filas, tarjetas, pies), nunca con pestañas nuevas.
2. **Cada URL responde a una intención distinta y tiene datos propios.** Nada de páginas que solo cambien un nombre.
3. **Lo que ya es estado de la app pasa a ser URL.** La zona (hoy en `localStorage`) y el idioma (hoy en `navigator`) se vuelven parte de la ruta. El resultado es el mismo producto, ahora direccionable.
4. **Contenido estable prerenderizado + dato vivo en el navegador** (ver `07`).
5. **Momento óptimo**: la web tiene 3 días. Cambiar URLs ahora casi no cuesta (no hay enlaces ni historial que perder). Dentro de unos meses costará más.

## 2. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| `/tiempo/{zona}` y `/mar/{zona}` | `/lanzarote/{zona}` (una sola página por zona) | La app ya separa dos vistas (Hoy y Mar) con intenciones de búsqueda distintas: «tiempo famara» frente a «mareas famara». Una página única mezclaría ambas en una URL larga y obligaría a diseñar una vista nueva. «Lanzarote» en la ruta no aporta: todo el sitio es Lanzarote y va en title y H1 |
| Mantener `/mar` para mareas + oleaje + agua | Separar `/mareas` | La página Mar ya muestra las tres cosas juntas. Separarla crearía dos vistas casi iguales (riesgo de contenido escaso y canibalización). Se revisa con datos de Search Console: si las búsquedas de «oleaje» llegan a `/mar` y rinden peor que las de «mareas», se valora separar |
| Mantener las rutas actuales (`/zonas`, `/donde-ir`) | Renombrar | Son cortas, claras y ya están en el menú |
| Español en la raíz, inglés en `/en/` | Subdominio `en.` o dominio `.co.uk` | Un solo dominio suma autoridad; es lo más simple con un Worker |
| `?dia=` para otros días, con canonical a la URL sin parámetro | `/tiempo/famara/manana` indexable | 7 días × 9 zonas × 2 idiomas multiplicaría URLs con contenido caducado. «Mañana» se cubre con un bloque visible en cada página |

## 3. Mapa de URLs propuesto

Leyenda de prioridad: ver `10-plan-implementacion.md`. «Menú» = pestaña existente; «Contextual» = enlazada desde contenido.

| URL | Keyword principal | Secundarias | Intención | Acceso | Indexable | Prioridad |
|---|---|---|---|---|---|---|
| `/` | tiempo en Lanzarote | el tiempo en Lanzarote hoy, mañana, previsión 7 días | Herramienta | Menú (Hoy) | Sí | P1 (optimizar) |
| `/zonas` | tiempo por zonas Lanzarote | mapa del tiempo Lanzarote, comparar zonas | Herramienta / hub | Menú (Zonas) | Sí | P1 |
| `/mar` | mareas Lanzarote | pleamar y bajamar, estado del mar, oleaje, temperatura del agua | Herramienta / hub | Menú (Mar) | Sí | P1 |
| `/donde-ir` | playas sin viento hoy Lanzarote | dónde ir hoy, qué playa hoy, mar tranquilo | Herramienta | Menú (Dónde ir) | Sí | P1 |
| `/tiempo/{zona}` ×9 | tiempo en {zona} | {zona} hoy, mañana, viento {zona} | Herramienta local | Contextual (Zonas, selector, tarjetas) | Sí | P1 |
| `/mar/{zona}` ×9 | mareas {zona} | olas {zona}, temperatura del agua {zona} | Herramienta local | Contextual (Mar, selector) | Sí | P1 |
| `/viento` | viento Lanzarote | previsión de viento, rachas, dónde hay menos viento | Herramienta | Contextual (fila de viento de Hoy, mapa de Zonas) | Sí | P1 |
| `/calima` | calima Lanzarote | calima hoy, hasta cuándo, qué es | Herramienta + info | Contextual (veredicto con calima, pie) | Sí | P2 |
| `/avisos` | avisos Lanzarote | alerta, avisos AEMET, costeros | Herramienta | Contextual (banner de avisos, pie) | Sí | P2 |
| `/clima` y `/clima/{mes}` ×12 | tiempo Lanzarote en {mes} | temperatura del agua en {mes}, mejor época | Informacional | Contextual (pie, `/sobre`) | Sí | P2 |
| `/guias/viento-en-lanzarote` | por qué hace viento en Lanzarote | alisios, dónde no hace viento | Informacional | Contextual (`/viento`) | Sí | P2 |
| `/guias/mareas-estimadas` | cómo leer las mareas | pleamar, bajamar, coeficiente | Informacional | Contextual (`/mar`) | Sí | P2 |
| `/sobre` | LanzaMet (marca) | fuentes, metodología | Confianza / E-E-A-T | Ajustes, Legal, pie | Sí | P1 |
| `/legal` | — | — | Servicio | Ajustes | Sí (sin prioridad en sitemap) | — |
| `/mejorar` | — | — | Servicio | Ajustes | `noindex, follow` | P2 |
| `/en/…` | Espejo en inglés (ver `09`) | | | Selector de idioma | Sí | P2 |
| `/de/…` | Parcial en alemán | | | Selector de idioma | Sí | P3 |
| URL desconocida | — | — | — | — | 404 real | P0 |

Slugs de zona: los ids actuales de `src/app/core/data/locations.ts` (`puerto-del-carmen`, `arrecife`, `playa-blanca`, `costa-teguise`, `famara`, `la-santa`, `orzola`, `arrieta`, `el-golfo`). Son estables, en minúsculas y sin acentos. No hay que traducirlos (son topónimos).

**Total en español**: 4 actuales + 18 de zona + 4 temáticas + 13 de clima + 2 guías + `/sobre` + `/legal` ≈ 43 URL. Todas con datos o texto propios. Por debajo del umbral de alerta de 50 páginas de lugar del método de la skill SEO (`quality-gates.md`): son 18 páginas de lugar, cada una con celda de mar propia, webcam, orientación y descripción distintas.

## 4. Fichas de página

Titles: unos 60 caracteres como máximo. Descriptions: unos 155. H1: estable, visible, con la entidad. El **veredicto** («Amanece nublado») pasa de `<h1>` a un párrafo destacado con el mismo estilo (`class="verdict"`): visualmente no cambia nada.

### 4.1 `/` (Hoy) — papel: hub principal de «tiempo en Lanzarote»

- **Title**: `El tiempo en Lanzarote hoy y mañana: viento y mar · LanzaMet`
- **Description**: `Cómo está hoy el día en Lanzarote: temperatura, viento, mar y mareas por zonas, en palabras claras. Previsión hora a hora y 7 días, sin anuncios.`
- **H1**: `El tiempo en Lanzarote hoy`. Hoy la zona por defecto es Puerto del Carmen (`locations.store.ts:10`); la etiqueta de zona visible sigue indicando la zona (p. ej. «Puerto del Carmen»), y un enlace «Ver Puerto del Carmen» lleva a `/tiempo/puerto-del-carmen`. **Requiere validación de diseño**: el H1 puede ocupar el sitio de la línea pequeña «En Lanzarote» que ya existe (`today-hero.html`, bloque `.meta`) con el mismo estilo.
- **Estructura de encabezados**:
  - H1 El tiempo en Lanzarote hoy
  - H2 Ahora: viento, mar y marea (hoy está `visually-hidden`; se mantiene)
  - H2 Próximas horas
  - H2 ¿Dónde ir hoy?
  - H2 Hoy, en detalle
  - H2 Próximos días
  - (nuevo, compacto) H2 El tiempo por zonas: lista de 9 enlaces `/tiempo/{zona}` con temperatura y viento. Reutiliza el patrón de tarjetas de Zonas o la lista del selector.
- **Datos**: los actuales. Nuevo: una frase de isla en el prerender («Lanzarote tiene 9 zonas con previsión propia…») y, en el navegador, el resumen de isla de `core/insights/island.insight.ts`.
- **Componentes**: `TodayHero`, `Conditions`, `HourTimeline`, `DayList`, `PlanItem`, `SunPath`.
- **Enlaces internos**: `/zonas`, `/mar`, `/donde-ir` (menú); `/viento` (fila de viento, hoy un botón); `/tiempo/{zona}` ×9; `/avisos` (banner); `/calima` (cuando hay calima); `/sobre` (pie).
- **Datos estructurados**: `WebSite`, `Organization`, `WebPage` (`about` → `Place` Lanzarote, `sameAs` Wikidata/Wikipedia).
- **Canonical**: `https://lanzamet.com/`. `hreflang`: `es`, `en` (`/en/`), `x-default` (`/`).
- **Canibalización**: la home no debe titularse con ninguna zona concreta.

### 4.2 `/tiempo/{zona}` — ej. `/tiempo/famara`

- **Title**: `Tiempo en Famara hoy: viento y mar en Lanzarote · LanzaMet`
- **Description**: `Previsión para Famara hoy y mañana: temperatura, viento y rachas, oleaje de la costa noroeste y marea estimada. Hora a hora y 7 días.`
- **H1**: `El tiempo en Famara, Lanzarote`
- **Contenido estable propio** (prerenderizado, 80-150 palabras por zona, escrito a mano a partir de `locations.ts` y del README): municipio (Teguise), costa a la que mira (noroeste), qué significa para el viento y el mar, de qué celda del modelo sale el mar y a cuántos km está, si hay estación AEMET cercana («Medido») o por qué no, webcam enlazada, zonas que comparten celda del modelo y cómo se dice. Ejemplo de la información diferencial ya documentada: «El tiempo de Famara y La Santa sale de la misma celda del modelo; el mar no» (README, tabla de puntos de consulta).
- **Datos vivos**: los de Hoy para esa zona.
- **Encabezados**: H1, H2 Ahora, H2 Próximas horas, H2 Mañana en Famara (bloque nuevo y pequeño con el día siguiente), H2 Próximos días, H2 Sobre esta zona (texto estable), H2 Zonas cercanas (enlaces).
- **Enlaces**: `/mar/famara`, zonas vecinas (La Santa, Órzola…), `/zonas`, `/viento`.
- **Datos estructurados**: `WebPage` + `about` → `Place` (`name`, `geo` `GeoCoordinates` de `position`, `containedInPlace` → Lanzarote), `BreadcrumbList` (Inicio › Zonas › Famara).
- **Canonical**: autorreferente. `?dia=` → canonical sin parámetro.
- **Comportamiento**: visitar la URL selecciona la zona (y la guarda como ahora). El selector de zona pasa a navegar a la URL (los botones del panel pueden ser `<a href>` con el mismo aspecto).

### 4.3 `/mar` — hub de «mareas Lanzarote»

- **Title**: `Mareas en Lanzarote hoy: pleamar, bajamar y estado del mar · LanzaMet`. Son 67 caracteres; versión corta: `Mareas en Lanzarote hoy: pleamar, bajamar y olas · LanzaMet`.
- **Description**: `Pleamar y bajamar estimadas de hoy y mañana, altura y periodo de las olas, mar de fondo y temperatura del agua en las 9 zonas de Lanzarote.`
- **H1**: `Mareas y estado del mar en Lanzarote`. El titular dinámico actual («Marea baja ahora») pasa a ser el párrafo destacado.
- **H2**: Marea de hoy · Pleamares y bajamares (estimadas) · El mar en {zona} · **Temperatura del agua hoy** (`id="temperatura-agua"`) · Dónde está el mar más tranquilo · Cómo calculamos la marea (enlace a la guía).
- **Enlaces**: `/mar/{zona}` ×9 desde la lista «mar más tranquilo», `/guias/mareas-estimadas`, `/avisos`.
- **Datos estructurados**: `WebPage`, `about` → `Place` Lanzarote. Sin `FAQPage` (sin efecto en Google desde mayo de 2026).

### 4.4 `/mar/{zona}` — ej. `/mar/orzola`

- **Title**: `Mareas en Órzola hoy: olas y pleamar en Lanzarote · LanzaMet`
- **H1**: `Mareas y estado del mar en Órzola`
- **Contenido estable**: punto de mar (29,292 / −13,458, a ~8 km), orientación (norte), mar de fondo típico del norte en invierno (como explicación general, sin cifras inventadas). Para Órzola: H2 «El mar entre Órzola y La Graciosa», que aclara que el punto del modelo está mar adentro y que el estado del estrecho de El Río puede diferir; enlace a la naviera solo como referencia y a AEMET costeros.
- **Datos estructurados**: `Place` + `BreadcrumbList`.

### 4.5 `/zonas` — hub geográfico

- **Title**: `El tiempo por zonas en Lanzarote: mapa de hoy · LanzaMet`
- **H1**: `Lanzarote, zona a zona` (se mantiene: ya es estable y descriptivo).
- **Cambio clave**: cada tarjeta y cada punto del mapa enlaza con `<a href="/tiempo/{zona}">`. Hoy abren o seleccionan la zona.
- **Datos estructurados**: `CollectionPage` + `ItemList` de las 9 `Place`.

### 4.6 `/donde-ir`

- **Title**: `Dónde ir hoy en Lanzarote: playas sin viento y mar tranquilo · LanzaMet` (68; corto: `Playas sin viento hoy en Lanzarote: dónde ir · LanzaMet`).
- **H1**: `¿Dónde ir hoy en Lanzarote?`
- **Nuevo H2 estable**: «Cómo elegimos los planes» (3-4 frases: viento, mar, aviso costero, «orientativo, no una garantía»).
- **Enlaces**: cada plan → `/tiempo/{zona}`; plan de mar → `/mar/{zona}`.

### 4.7 `/viento` (nueva)

- **Title**: `Viento en Lanzarote hoy: rachas y dónde sopla menos · LanzaMet`
- **H1**: `El viento en Lanzarote hoy`
- **Contenido**: viento por zona ahora (mapa de Zonas en modo viento o lista con flechas y Beaufort), rachas máximas del día por zona, 24 h de la zona elegida (`HourTimeline`), «Dónde hay menos viento hoy» (ordenado), escala de colores y Beaufort explicada (texto estable), alisio (`wind.tradeWind`).
- **Reutiliza**: `IslandMap`, `HourTimeline`, `WindGauge`.
- **Enlaces**: `/donde-ir`, `/guias/viento-en-lanzarote`, `/tiempo/{zona}`.

### 4.8 `/calima` (nueva)

- **H1**: `Calima en Lanzarote hoy`. Estado actual (polvo en superficie CAMS, umbral de 100 µg/m³ explicado, «orientativo»), próximos días si el dato lo permite, qué es la calima, efectos y consejos generales enlazando a fuentes oficiales (AEMET, Gobierno de Canarias), avisos activos.
- **Riesgo**: contenido de salud (YMYL). Consejos genéricos y enlaces a la autoridad sanitaria, sin recomendaciones médicas propias.

### 4.9 `/avisos` (nueva)

- **H1**: `Avisos meteorológicos en Lanzarote`. Avisos activos (AEMET, zonas 659101 y 659101C), qué significa cada color, «sin avisos ahora» con la hora de la última comprobación, enlace a AEMET. Útil en picos.

### 4.10 `/clima/{mes}` (nueva, P2)

- **H1**: `El tiempo en Lanzarote en noviembre`. **Solo con datos reales**: normales climatológicas (AEMET, estación Lanzarote Aeropuerto C029O, si están disponibles en OpenData; o reanálisis ERA5 de Open-Meteo Historical, CC BY 4.0) y temperatura del mar mensual (fuente a verificar). Bloque «¿Y hoy?» con enlace a `/`.
- Sin datos verificables, **no crear** estas páginas.

### 4.11 `/sobre` (nueva)

- Quién hace LanzaMet, por qué, cómo se calcula cada dato (modelos, celdas, validaciones con fecha), límites (marea estimada, oleaje mar adentro), fuentes y licencias, contacto. Es lo que hoy está repartido entre el README y Legal.

## 5. Enlazado interno

| Desde | Hacia | Ancla de ejemplo | Cambio de diseño |
|---|---|---|---|
| Hoy, fila de viento | `/viento` | «Ver el viento en toda la isla» | Ninguno: el `<button>` pasa a `<a>` con el mismo aspecto, y las 24 h siguen accesibles con su propio control |
| Hoy, bloque nuevo «El tiempo por zonas» | `/tiempo/{zona}` | «Famara · 24° · viento flojo» | Bloque nuevo y compacto (validar con diseño) |
| Zonas, tarjetas y mapa | `/tiempo/{zona}` | Nombre de la zona | Ninguno (envolver en `<a>`) |
| Mar, «mar más tranquilo» | `/mar/{zona}` | Nombre | Ninguno |
| Selector de zona (panel) | `/tiempo/{zona}` o `/mar/{zona}` según la página | Nombre | Ninguno (botón → enlace) |
| Dónde ir, cada plan | `/tiempo/{zona}` | «Playa en Arrecife» | Ninguno |
| Banner de avisos | `/avisos` | «Ver todos los avisos» | Enlace de texto |
| Pie de página (`today-footer`, pies de página) | `/sobre`, `/avisos`, `/calima`, `/clima` | Texto | Línea de enlaces discreta |
| `/tiempo/{zona}` | `/mar/{zona}`, vecinas, `/zonas` | «Mareas en Famara» | Bloque al final |

Breadcrumbs: solo en `BreadcrumbList` (JSON-LD), sin migas visibles, para no tocar el diseño. Opcionalmente, migas visibles en las páginas nuevas.

## 6. Canibalización: reglas

| Pareja | Regla |
|---|---|
| `/` vs `/tiempo/puerto-del-carmen` | La home habla de la isla (title sin zona); la zona por defecto se ve, pero su URL es la de zona |
| `/` vs `/zonas` | `/` = cómo está el día; `/zonas` = comparar zonas en el mapa |
| `/mar` vs `/mar/{zona}` | Hub de isla vs. zona |
| `/viento` vs `/donde-ir` | Dato de viento vs. planes recomendados |
| `/viento` vs `/guias/viento-en-lanzarote` | Hoy vs. explicación estable |
| `/mar` vs `/clima/{mes}` (agua) | Hoy vs. media del mes |
| `/es` vs `/en` | Mismo contenido, con `hreflang` recíproco |

## 7. Indexación y sitemap

- `sitemap.xml` con todas las URL indexables (ES y EN), `lastmod` = fecha de build para páginas estables. **No** poner `lastmod` de «ahora» en cada build si el contenido estable no cambió: Google ignora `lastmod` poco fiables.
- `robots.txt`: `Allow: /` y línea `Sitemap:`. **Sin bloquear `/api/`**: el renderizado de Google lo necesita para cargar los datos (corregido el 27-10-2026, ver `14-backlog-seo.md`).
- `noindex, follow`: `/mejorar`, vista 404.
- Parámetros `?dia=`, `?utm_*`: canonical a la URL limpia.
