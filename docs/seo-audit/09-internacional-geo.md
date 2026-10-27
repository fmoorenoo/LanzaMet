# 09 · SEO internacional y buscadores con IA

## Parte A · Multilingüe (español, inglés, alemán)

### A.1 Situación actual (verificado)

- Dos idiomas, `es` y `en`, con diccionarios tipados completos (`core/i18n/messages/es.ts` ≈ 44 KB, `en.ts` ≈ 42,5 KB) y formato por locale (`es-ES`, `en-GB`).
- Se eligen **en el navegador**, en la **misma URL**: preferencia guardada → `navigator.languages` → español (`i18n.store.ts`).
- No hay `hreflang`, ni URLs por idioma, ni `og:locale`. El manifest va solo en español (es normal: el manifest admite un idioma).
- Consecuencia (T-01, **P0**): Google solo puede indexar **una** versión por URL, y probablemente la inglesa (Googlebot no envía `Accept-Language`, según [Google](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages)).

### A.2 ¿Merece la pena cada idioma?

| Idioma | Mercado (verificado) | Demanda observada | Coste | Decisión |
|---|---|---|---|---|
| Español | Residentes de Lanzarote y Canarias, turismo nacional | «tiempo/mareas/viento + lugar», «hoy/mañana», AEMET | Ya existe | **Idioma principal, en la raíz** |
| Inglés | 1 685 496 turistas británicos en 2025 (ISTAC), más Irlanda | Clima por mes, sea temperature, tide times, is Lanzarote windy, calima warning | La traducción **ya existe**; falta enrutar, revisar los textos nuevos y mantenerlos | **Sí** (P2, después del prerender y las URLs por zona) |
| Alemán | 259 517 turistas en 2025 (6,5 veces menos que el Reino Unido) | Wetter + Monat, Wassertemperatur, windstille Strände, Gezeiten | Traducir ~44 KB de mensajes + contenido estable, y mantenerlo. El diccionario es tipado: añadir `de` obliga a traducir todo para compilar | **Más adelante y parcial** (P3): solo cuando EN funcione en Search Console |

### A.3 Estructura propuesta

| ES (raíz) | EN | DE (fase 3, parcial) |
|---|---|---|
| `/` | `/en/` | `/de/` |
| `/zonas` | `/en/places` | — |
| `/mar` | `/en/sea` | `/de/meer` |
| `/donde-ir` | `/en/where-to-go` | `/de/wohin-heute` |
| `/viento` | `/en/wind` | — |
| `/tiempo/{zona}` | `/en/weather/{zona}` | — |
| `/mar/{zona}` | `/en/sea/{zona}` | — |
| `/calima` | `/en/calima` | `/de/calima` |
| `/avisos` | `/en/warnings` | — |
| `/clima/{mes}` | `/en/climate/{month}` | `/de/klima/{monat}` |
| `/sobre` | `/en/about` | — |

- Slugs traducidos (mejor para el usuario y para el CTR). Los slugs de zona no se traducen.
- **Sin redirecciones automáticas por idioma**. Un visitante con el navegador en inglés que llega a `/` ve español y un aviso discreto: «Read this page in English →». Lo mismo al revés. La elección en Ajustes navega a la URL equivalente y se guarda.
- `<html lang>` fijo por URL, en el HTML prerenderizado.

### A.4 `hreflang` y canonical

En cada página, en el `<head>` prerenderizado (o en el sitemap, pero no en los dos con valores distintos):

```html
<link rel="canonical" href="https://lanzamet.com/mar">
<link rel="alternate" hreflang="es" href="https://lanzamet.com/mar">
<link rel="alternate" hreflang="en" href="https://lanzamet.com/en/sea">
<link rel="alternate" hreflang="x-default" href="https://lanzamet.com/mar">
```

- Canonical **autorreferente** en cada idioma (la versión EN no canonicaliza a la ES).
- Reciprocidad obligatoria: si ES apunta a EN, EN apunta a ES.
- `hreflang` solo entre páginas equivalentes. Una página DE que no tenga par EN no lo declara.
- `x-default` → versión española.
- Códigos de idioma sin región (`es`, `en`, `de`): el contenido no cambia por país.

### A.5 Traducción y mantenimiento

- Hoy el proyecto ya garantiza que no falte ninguna clave (`en.ts` tipado contra `es.ts`, y un test de marcadores). Es una base excelente.
- El contenido estable nuevo (intros, «Sobre esta zona», guías, clima) debe redactarse **en cada idioma**, no traducirse automáticamente sin revisión: es la parte que verán buscadores y IA.
- Unidades: °C, km/h y m en ambos idiomas (el público británico usa °C para el tiempo de vacaciones). Valorar mostrar mph y °F como dato secundario en EN (decisión de producto, P3).
- Avisos AEMET: el API ya usa `descriptionEn` cuando AEMET lo publica (README §Idiomas).

### A.6 Criterios de aceptación

- `curl https://lanzamet.com/en/sea` devuelve un HTML con `lang="en"`, title en inglés, canonical propio y los tres `hreflang`.
- Search Console → Inspección de URL de `/` y `/en/` muestra cada una en su idioma.
- Ningún cambio de idioma redirige sin acción del usuario.

---

## Parte B · Buscadores con IA (GEO / AEO)

### B.1 Qué dice Google (verificado)

La guía [Optimizing your website for generative AI features on Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (actualizada el 10-07-2026) dice:

- Optimizar para la búsqueda generativa «es optimizar para la experiencia de búsqueda, y por tanto sigue siendo SEO».
- Requisito para AI Overviews y AI Mode: la página debe estar **indexada y ser apta para mostrarse con fragmento**, y el sitio debe estar incluido en las funciones de IA en Search Console. Cumplirlo no garantiza aparecer.
- **No** hacen falta archivos para IA, `llms.txt` ni marcado especial: «Google Search ignora estos archivos».
- Los datos estructurados no son necesarios para la IA, aunque sí ayudan al SEO general.

Conclusión: para Google, todo lo de este informe (indexabilidad, idioma por URL, contenido estable, entidades claras) **es** la estrategia de IA. No hay atajos.

### B.2 Estado de Lanzamet frente a cada sistema

| Sistema | Cómo obtiene el contenido (documentación pública; inferencia donde se indica) | Estado de Lanzamet |
|---|---|---|
| Google AI Overviews / AI Mode | Índice de Google (renderiza JS) | Depende de T-01 (idioma) y del contenido estable. Hoy, como mucho, una página por ruta y en inglés |
| ChatGPT Search | `OAI-SearchBot` y resultados de terceros (inferencia: no ejecuta JS) | Recibe 200 y un HTML vacío: **no ve nada** |
| Perplexity | `PerplexityBot` (inferencia: no ejecuta JS) | Ídem |
| Claude (búsqueda web) | `Claude-SearchBot` / `ClaudeBot` (inferencia: no ejecuta JS) | Ídem |
| Microsoft Copilot | Índice de Bing (Bingbot renderiza JS en parte; no verificado para esta web) | Sin verificar; `site:lanzamet.com` en Bing no devolvió resultados el 27-10-2026 (no concluyente) |
| Gemini (app) | Infraestructura de Google | Como Google |

**Verificado**: con su user agent, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, CCBot y Bingbot reciben `200` y 1 676 bytes. Cloudflare no los bloquea (no se probó desde sus IP reales). El prerender (B-10) es, por tanto, **la mejora más importante para la IA**.

### B.3 Técnicas fundamentadas

| Técnica | Por qué | Dónde |
|---|---|---|
| Contenido estable en HTML | Los rastreadores de IA que no ejecutan JS solo leen el HTML | B-10 |
| Respuesta en la primera frase de cada sección | Facilita extraer un pasaje autosuficiente | Intros, preguntas visibles (`08` §5) |
| Entidades geográficas explícitas | «Famara (Teguise, Lanzarote, costa noroeste)» desambigua | H1, intro, `Place` en JSON-LD |
| Fuente y fecha junto a cada dato | Los modelos citan lo verificable | Ya existe `DataCredit`; añadir `<time datetime>` |
| Metodología pública | Diferencia frente a competidores (ver `04` §5) | `/sobre` |
| Identidad del responsable | E-E-A-T en temas de seguridad (YMYL) | `/sobre`, E-01 |
| Menciones en medios locales | Señal de entidad (no se puede forzar) | `12` §4 |

### B.4 Hipótesis experimentales (P3, sin garantía)

| Idea | Evidencia | Coste | Decisión |
|---|---|---|---|
| `llms.txt` | Google lo ignora (guía oficial). Ningún gran proveedor ha confirmado que lo use | Muy bajo | Opcional; no prioritario |
| Inyectar en el borde una frase con el dato del día (opción B de `07`) para bots sin JS | Plausible para ChatGPT o Perplexity con consultas de «hoy» | Medio | Fase 3, medir |
| Versión Markdown de las páginas | Sin evidencia de uso | Medio | No |
| Endpoint público de datos (JSON abierto) | Podría citarse; atención a las licencias de Open-Meteo (CC BY 4.0, no comercial) y AEMET | Medio | Fase 3 |

### B.5 Política de rastreadores de IA (decisión del responsable)

- Hoy se permite a todos (sin robots.txt y sin bloqueo de Cloudflare). Para aparecer en ChatGPT Search o Perplexity hay que **seguir permitiendo** a `OAI-SearchBot`, `PerplexityBot` y `Claude-SearchBot`.
- Rastreadores de entrenamiento (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`): bloquearlos o no es una decisión editorial, no de SEO. Bloquear `Google-Extended` **no** afecta a AI Overviews (eso se controla en Search Console).
- Licencias: los datos son de Open-Meteo (CC BY 4.0) y AEMET (reutilización con cita). El contenido propio de Lanzamet sí es decisión propia.
- **No prometemos** visibilidad en IA: no hay forma de medirla con fiabilidad sin herramientas de terceros; Search Console agrega AI Overviews y AI Mode dentro del rendimiento web.
