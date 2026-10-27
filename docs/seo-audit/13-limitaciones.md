# 13 · Limitaciones y datos pendientes

## 1. Lo que no se pudo verificar

| Dato | Motivo | Cómo obtenerlo |
|---|---|---|
| Estado real de indexación en Google (qué URLs, en qué idioma) | Sin acceso a Search Console | B-06; Inspección de URL de `/`, `/mar`, `/zonas` → «Probar URL publicada» → captura y HTML |
| ~~**Idioma con el que Google renderiza** (T-01)~~ | **Resuelto el 27-10-2026**: en la Inspección de URL apareció el aviso «Read in English», que solo sale a navegadores en inglés. El renderizador de Google usa inglés, así que T-01 queda verificado | — |
| Clics, impresiones, CTR, posiciones, consultas, países, dispositivos, evolución | Sin Search Console. La web tiene 3 días | Search Console a partir de 2-4 semanas tras verificarla |
| Core Web Vitals de campo (CrUX) | Sin tráfico suficiente; PageSpeed Insights devolvió 429 (cuota anónima agotada) | Search Console → Core Web Vitals; PSI con clave de API |
| Volúmenes de búsqueda, KD, CPC | Sin Keyword Planner ni herramientas de pago (no hay DataForSEO configurado) | Keyword Planner (cuenta de Google Ads) o las consultas de Search Console |
| Google Trends y estacionalidad | HTTP 429 | Consultar a mano en trends.google.com |
| SERP de Google localizadas (ES, GB, DE) | Google pidió consentimiento; se usaron Bing y un buscador con sede en EE. UU. | Consultas manuales en modo incógnito, o una herramienta de rank tracking |
| Posiciones de competidores | Ídem | Ídem |
| JSON-LD, meta y hreflang de competidores | WebFetch no expone el `<head>` | Ver el código fuente a mano |
| Comportamiento de los rastreadores de IA desde sus IP reales | Solo se probó su user agent | Registros de Cloudflare (Security → Bots, Analytics) |
| Indexación en Bing | `site:lanzamet.com` devolvió resultados ajenos (no concluyente) | Bing Webmaster Tools |
| Backlinks | Sin Moz, Ahrefs ni Bing WMT; la web es nueva | Search Console → Enlaces; Bing WMT |
| Que el despliegue publicado sea exactamente el commit `9e88bd3` | No hay versión expuesta | `npx wrangler deployments list` |
| Normales climatológicas mensuales y temperatura del mar por mes (para B-19) | No se comprobó su disponibilidad ni sus licencias | AEMET OpenData (valores climatológicos normales de C029O) u Open-Meteo Historical; verificar licencia |
| Requisitos legales (LSSI, identidad del titular) | No es asesoría legal | Asesoría |

## 2. Herramientas que no funcionaron

- **Scripts de la skill `claude-seo`** (`render_page.py`, `google_auth.py`, `seo_updates.py`…): requieren Python 3.11-3.14 y el equipo no tiene Python. Se usaron las guías de referencia de la skill y equivalentes en Node y curl.
- **PageSpeed Insights API**: 429 (cuota anónima diaria agotada).
- **Lighthouse**: una de las tres ejecuciones móviles de `/` falló (`NO_NAVSTART`); se repitió dos veces con éxito.
- **Servidor MCP `angular-cli`**: no conectó (tiempo agotado). No era imprescindible.

## 3. Cómo se verificó (para repetirlo)

```bash
# Cabeceras y estados
curl -s -o /dev/null -D - https://lanzamet.com/robots.txt
curl -s -o /dev/null -w '%{http_code}\n' https://lanzamet.com/no-existe-xyz

# DOM renderizado en inglés y en español (Chrome headless)
chrome --headless=new --lang=en-US --user-agent="…Googlebot/2.1…" \
  --virtual-time-budget=15000 --dump-dom https://lanzamet.com/ > home-en.html
chrome --headless=new --lang=es-ES … > home-es.html

# Lighthouse
npx lighthouse@12 https://lanzamet.com/ --only-categories=performance,seo,accessibility,best-practices --output=json
```

Los archivos intermedios (DOM y JSON de Lighthouse) se guardaron en el directorio temporal de la sesión, no en el repositorio.

## 4. Accesos necesarios para la siguiente fase

1. **Google Search Console** (propiedad de dominio, verificada por DNS en Cloudflare).
2. **Bing Webmaster Tools**.
3. Opcional: **clave de la API de PageSpeed Insights / CrUX** (gratuita).
4. Opcional: **Keyword Planner** o una herramienta de keywords con datos de España, Reino Unido y Alemania.
5. Panel de **Cloudflare** (Crawler Hints, reglas de bots, analítica del dominio).
6. Decisiones del responsable: B-01a (primera vista en español), identidad pública (B-13), política de rastreadores de IA de entrenamiento (`09` §B.5), alemán (B-28).

## 5. Distinción de niveles de evidencia usada en todos los documentos

- **Verificado**: observado en la web publicada, en el código o en una fuente oficial con fecha.
- **Inferencia**: deducido de lo verificado y de la documentación.
- **Hipótesis**: plausible, a confirmar con datos que hoy no hay.
