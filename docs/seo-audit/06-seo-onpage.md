# 06 · SEO on-page

Estado actual verificado en el DOM renderizado (27-10-2026) y propuesta por página. Los textos propuestos son borradores para revisar; deben vivir en `src/app/core/i18n/messages/es.ts` y `en.ts` (el proyecto exige que cada clave exista en los dos idiomas).

## 1. Titles

| URL | Actual (ES) | Propuesto (ES) | Propuesto (EN, en `/en/…`) |
|---|---|---|---|
| `/` | Hoy en Lanzarote · LanzaMet | El tiempo en Lanzarote hoy y mañana: viento y mar · LanzaMet | Lanzarote weather today: wind, sea and tides · LanzaMet |
| `/zonas` | Zonas · LanzaMet | El tiempo por zonas en Lanzarote: mapa de hoy · LanzaMet | Lanzarote weather by area: today's map · LanzaMet |
| `/mar` | Mar y mareas · LanzaMet | Mareas en Lanzarote hoy: pleamar, bajamar y olas · LanzaMet | Lanzarote tide times and sea today · LanzaMet |
| `/donde-ir` | ¿Dónde ir hoy? · LanzaMet | Playas sin viento hoy en Lanzarote: dónde ir · LanzaMet | Where to go in Lanzarote today: sheltered beaches · LanzaMet |
| `/tiempo/{zona}` | — | Tiempo en {Zona} hoy: viento y mar en Lanzarote · LanzaMet | {Zone} weather today, Lanzarote: wind and sea · LanzaMet |
| `/mar/{zona}` | — | Mareas en {Zona} hoy: olas y pleamar en Lanzarote · LanzaMet | {Zone} tide times and waves today · LanzaMet |
| `/viento` | — | Viento en Lanzarote hoy: rachas y dónde sopla menos · LanzaMet | Lanzarote wind today: gusts and sheltered spots · LanzaMet |
| `/calima` | — | Calima en Lanzarote hoy: polvo y avisos · LanzaMet | Calima in Lanzarote today: Saharan dust · LanzaMet |
| `/avisos` | — | Avisos meteorológicos en Lanzarote hoy · LanzaMet | Weather warnings in Lanzarote today · LanzaMet |
| `/clima/{mes}` | — | El tiempo en Lanzarote en {mes}: temperatura y mar · LanzaMet | Lanzarote weather in {month}: temperature and sea · LanzaMet |
| `/sobre` | — | Sobre LanzaMet: fuentes y cómo calculamos el tiempo | About LanzaMet: sources and methodology |
| `/legal` | Legal y privacidad · LanzaMet | Igual | Legal and privacy · LanzaMet |
| `/mejorar` | Ayúdanos · LanzaMet | Igual (`noindex`) | Help us · LanzaMet |

Notas:
- Algunos titles superan los 60 caracteres por la marca. Google puede recortar el final: la keyword va siempre delante y la marca al final (`route.title` → `{page} · {brand}` ya lo hace).
- **No** usar «14 días» ni «tabla oficial»: Lanzamet da 7 días y mareas estimadas.
- Mantener «(Lanzarote)» en los títulos de zona para resolver ambigüedades (Playa Blanca, Puerto del Carmen, Arrecife).

## 2. Meta descriptions

Hoy hay **una sola description** para todas las rutas (`app.description`, `i18n.store.ts:40-42`). Propuesta: una clave por ruta (`route.{x}.description`), con la misma estrategia de título (`I18nTitleStrategy` → ampliar a título + descripción, o un `SeoService` que lea `data.seo` de cada ruta).

| URL | Propuesta (ES) |
|---|---|
| `/` | Cómo está hoy el día en Lanzarote: temperatura, viento, mar y mareas por zonas, en palabras claras. Previsión hora a hora y 7 días, sin anuncios. |
| `/zonas` | Compara el tiempo de las 9 zonas de Lanzarote en un mapa: temperatura, cielo y viento de Famara a Playa Blanca, para hoy y los próximos días. |
| `/mar` | Pleamar y bajamar estimadas de hoy y mañana, altura y periodo de las olas, mar de fondo y temperatura del agua en las 9 zonas de Lanzarote. |
| `/donde-ir` | Qué playa o rincón de Lanzarote apetece hoy: dónde hay menos viento, el mar más tranquilo o el mejor atardecer, según la previsión de cada zona. |
| `/tiempo/{zona}` | Previsión para {Zona} hoy y mañana: temperatura, viento y rachas, olas de su costa y marea estimada. Hora a hora y 7 días. |
| `/mar/{zona}` | Pleamar y bajamar estimadas en {Zona}, altura y periodo de las olas, mar de fondo y temperatura del agua, hoy y mañana. |
| `/viento` | Viento en Lanzarote ahora, zona a zona: velocidad, rachas y dirección, hora a hora, y dónde sopla menos hoy para ir a la playa. |
| `/calima` | ¿Hay calima hoy en Lanzarote? Polvo en el aire según el modelo CAMS, qué es la calima y avisos oficiales de AEMET. |
| `/avisos` | Avisos meteorológicos activos de AEMET para Lanzarote y su costa, explicados: qué significa cada color y qué hacer. |

Las descripciones de zona deben añadir un dato distintivo real de cada zona (orientación, si tiene estación, webcam) para no ser plantillas idénticas.

## 3. H1 y jerarquía

| URL | H1 actual | Problema | H1 propuesto |
|---|---|---|---|
| `/` | «Amanece nublado» (veredicto, cambia cada hora) | Sin entidad ni keyword; un H2 («Compartir el tiempo») aparece antes del H1 en el DOM | El tiempo en Lanzarote hoy |
| `/mar` | «Marea baja ahora» / «Mareas del {día}» | Cambia; sin «Lanzarote» | Mareas y estado del mar en Lanzarote |
| `/zonas` | Lanzarote, zona a zona | Correcto | Igual |
| `/donde-ir` | ¿Dónde ir hoy? | Falta «Lanzarote» | ¿Dónde ir hoy en Lanzarote? |
| `/legal`, `/mejorar` | Correctos | — | Igual |

Implementación sin cambiar el diseño:
- El veredicto (`today-hero.html:129`, `id="weather-verdict"`) y el titular de marea (`sea.page.html:31-39`) pasan de `<h1>` a `<p>` con las mismas clases. **Ojo**: hoy el veredicto es el elemento LCP (Lighthouse); al ser `<p>` sigue siéndolo, no cambia nada visual.
- El nuevo H1 ocupa la línea pequeña que ya existe («En Lanzarote», `.meta` de `today-hero.html`) o va como `visually-hidden`. Lo visible es preferible: un H1 oculto es válido, pero aporta menos señal. Decisión de diseño.
- La hoja «Compartir el tiempo» (H2) no debe estar en el DOM antes de abrirse, o se mueve después del H1 (O-02/O-03).
- Paneles (Elige zona, ¿Qué día…?, Ajustes): renderizar su contenido solo al abrirse (`@if` sobre el estado de apertura) o usar `<p role="heading">`. Hoy añaden 7 encabezados a cada página (O-03).

## 4. Contenido y semántica

- **Palabras renderizadas** (inglés, 27-10-2026): Hoy 875 · Zonas 584 · Mar 514 · Dónde ir 481 · Legal 955. Casi todo es dato vivo; **el texto estable explicativo es mínimo**. Para buscadores e IA hace falta un bloque estable por página (60-150 palabras): qué muestra, de dónde salen los datos y cómo leerlos. Esto no es relleno: es la explicación que hoy está solo en el README.
- **Unidades y fechas legibles**: ya están en texto («Olas de unos 40 cm · Agua a 23 °C», «Pleamar hacia las 13:20»). Muy bueno para citabilidad.
- **Tablas**: las pleamares y bajamares son listas. Valorar `<table>` con `<caption>` para hoy y mañana (mejor extracción por IA; validar con diseño).
- **Fecha de actualización**: «Actualizado a las…» ya existe; añadir un `<time datetime>` con la hora ISO.

## 5. Datos estructurados (plantillas)

Ponerlos en el HTML prerenderizado (B-10). Validar con la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results) y el [validador de Schema.org](https://validator.schema.org/).

### 5.1 Global (todas las páginas, una vez)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://lanzamet.com/#website",
      "url": "https://lanzamet.com/",
      "name": "LanzaMet",
      "inLanguage": ["es", "en"],
      "publisher": { "@id": "https://lanzamet.com/#org" }
    },
    {
      "@type": "Organization",
      "@id": "https://lanzamet.com/#org",
      "name": "LanzaMet",
      "url": "https://lanzamet.com/",
      "logo": "https://lanzamet.com/icons/icon-512.png"
    }
  ]
}
```

`Organization` → añadir `sameAs` solo cuando existan perfiles reales (redes, GitHub). `founder` o `Person`, solo si el titular decide identificarse (ver E-01).

### 5.2 Página de zona

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://lanzamet.com/tiempo/famara#webpage",
  "url": "https://lanzamet.com/tiempo/famara",
  "name": "El tiempo en Famara, Lanzarote",
  "inLanguage": "es",
  "isPartOf": { "@id": "https://lanzamet.com/#website" },
  "about": {
    "@type": "Place",
    "name": "Famara",
    "geo": { "@type": "GeoCoordinates", "latitude": 29.1155, "longitude": -13.5565 },
    "containedInPlace": { "@type": "Place", "name": "Lanzarote", "sameAs": "https://es.wikipedia.org/wiki/Lanzarote" }
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://lanzamet.com/" },
      { "@type": "ListItem", "position": 2, "name": "Zonas", "item": "https://lanzamet.com/zonas" },
      { "@type": "ListItem", "position": 3, "name": "Famara" }
    ]
  }
}
```

Las coordenadas salen de `locations.ts` (`position`). Que el JSON-LD de lugar se genere desde ahí evita que diverja.

### 5.3 Qué no usar y por qué

| Tipo | Motivo |
|---|---|
| `FAQPage` | Google retiró el resultado enriquecido para todos los sitios el 7-5-2026 ([registro de cambios de Google](https://developers.google.com/search/updates)). Las preguntas frecuentes **sí** valen como contenido visible (H2/H3 + párrafo) |
| `HowTo` | Retirado en 2023 |
| `SpecialAnnouncement` para avisos | Retirado en julio de 2025 |
| `Dataset` | Solo lo usa Dataset Search. Posible P3 si se publica un dataset abierto |
| `LocalBusiness` | Lanzamet no es un negocio local; sería marcado engañoso |
| `WeatherForecast` | No existe en Schema.org |
| `AggregateRating` | No hay valoraciones reales |

## 6. Open Graph y redes (O-04)

En cada página prerenderizada: `og:title`, `og:description`, `og:url` (= canonical), `og:type=website`, `og:site_name=LanzaMet`, `og:locale=es_ES` + `og:locale:alternate=en_GB`, `og:image` (1200×630, estática por sección), `twitter:card=summary_large_image`.

- Hoy al compartir se genera una **imagen en el dispositivo** y el enlace siempre es la raíz (`share-config.ts`, `shareLink()`). Propuesta: compartir la **URL de la zona** (`/tiempo/{zona}`) para que el enlace compartido construya autoridad en la página correcta.
- Imágenes OG: 4-6 PNG estáticas en `public/og/` (Hoy, Mar, Viento, Calima, Zonas) con el estilo de la escena. Sin datos del día (caducarían en la caché de WhatsApp).

## 7. Imágenes

- Solo hay una imagen de contenido: `icons/logo.png` (alt vacío, decorativa; el enlace lleva `aria-label`). Correcto.
- La escena es CSS/canvas: no compite en Google Imágenes ni lo necesita.
- Lighthouse en escritorio sugiere 53-65 KiB de ahorro con formatos modernos en `logo.png` (288×172). Menor; P3 (AVIF/WebP con `NgOptimizedImage` y `width`/`height`, que el proyecto ya exige en `CLAUDE.md`).

## 8. URLs

- Minúsculas, guiones, sin acentos, sin barra final. Ya cumplen. Mantener sin barra final y redirigir `/zonas/` → `/zonas` (301) cuando haya prerender (Cloudflare `html_handling` por defecto añade o quita la barra; **comprobar el comportamiento tras el cambio**).
