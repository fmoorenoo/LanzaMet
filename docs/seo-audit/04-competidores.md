# 04 · Competidores

Fecha: 27-10-2026.

## 0. Método y límites

- Los dominios proceden de WebSearch (buscador con sede en EE. UU.) y de SERP de Bing por mercado (`es-ES`, `en-GB`, `de-DE`). **No son SERP de Google localizadas**: se sabe quién aparece, no en qué posición está en Google. No se atribuyen posiciones, tráfico ni CTR.
- Las páginas se leyeron con WebFetch, que convierte a texto y **no muestra el `<head>`**. Meta descriptions, JSON-LD y hreflang de competidores casi nunca pudieron verificarse.
- Bloqueados (403): AccuWeather, seatemperature.org (una ruta), wetteronline.de, timeanddate.com, surfline.com. Sin contenido legible sin JavaScript: Windy.com y Windguru. BBC Weather inaccesible. Met Office (holiday weather) redirige a 404.
- **Verificado** = leído en la página (con URL). **Inferencia** = deducción.

## 1. Quién aparece por búsqueda (verificado en WebSearch y Bing)

| Búsqueda | Dominios observados |
|---|---|
| tiempo lanzarote (es-ES, Bing) | aemet.es, tiempo.com, eltiempo.es, meteoblue, AccuWeather, tiempo.es, tutiempo.net |
| tiempo en lanzarote (WebSearch) | tiempo3.com, cestee.es, meteomondo.it, metoffice.gov.uk |
| mareas lanzarote (Bing) | tablademareas.com, es.tideschart.com, ilanzarote.net, apalmet.es, canarias.app, mareasya.com, tutiempo.net, seatemperature.info |
| viento lanzarote (Bing) | windfinder, windy.app, windguru, topviajescanarias, tiempo.com, meteoblue, verplayas.com |
| oleaje lanzarote (Bing) | canarias.app, surf-forecast, windfinder, prevision.surf, aemet.es (marítima), tablademareas, windy.app, eltiempo.es |
| calima lanzarote (Bing) | calimacanarias.com, teneriffa-news.com, canaryforecast.com, canarias.app (**solo nicho**) |
| avisos aemet lanzarote (Bing) | aemet.es, emergencialanzarote.com, eltiempo.es/…/avisos, laprovincia.es, Gobierno de Canarias |
| playas lanzarote sin viento hoy (Bing) | lanzarote.com, viajeroscallejeros, surffamara, surfcanarias, verplayas, vientoplaya, tuplayahoy, aurabeach, divermar |
| temperatura del agua lanzarote hoy (Bing) | seatemperature.net/.info, snorkelforecast, canaryforecast, surf-forecast, playas-espana, tideschart |
| lanzarote weather (en-GB, Bing) | BBC, Met Office, AccuWeather, theweatheroutlook, meteoblue, yourweather.co.uk, holiday-weather |
| lanzarote weather november (en-GB) | guidetocanaryislands, AccuWeather, holiday-weather, lanzaroteweather.co.uk, TUI, howhot, weather-and-climate |
| lanzarote tide times (en-GB) | tideschart, tide-forecast, gazettelife, tidechecker, tidetime, tideking, seatemperatu.re |
| is lanzarote windy (en-GB) | lanzarotetransfer, lanzarote.com, guidetocanaryislands, windy.app, TripAdvisor |
| wetter lanzarote (de-DE) | wetter.com, wetter.de, teneriffa-news, meteoblue, wetteronline, kachelmannwetter, bergfex |
| wassertemperatur lanzarote (de-DE) | wassertemperatur.com/.org/.info, seatemperature.info, meerestemperatur.de, news.de, canaryforecast.com/de |

## 2. Fichas (verificado salvo indicación)

### Portales y organismos

**AEMET** ([Arrecife](https://www.aemet.es/es/eltiempo/prediccion/municipios/arrecife-id35004), [playa Las Cucharas](https://www.aemet.es/es/eltiempo/prediccion/playas/las-cucharas-3502425))
- Title: «El Tiempo: Arrecife (Las Palmas) - Predicción 7 días - Tabla - AEMET». H1: «Predicción por municipios. Arrecife (Las Palmas)».
- URLs `/municipios/{slug}-id{INE}`, `/playas/{slug}-{id}`. 7 idiomas.
- Municipio: 7 días en franjas de 6 h, avisos y estaciones. Playa: 3 días, cielo, viento y oleaje **en palabras**, agua y UV.
- Sin resumen en texto, sin enlaces entre playas de la isla, base técnica antigua.
- Autoridad máxima: no se compite con AEMET, **se complementa y se cita**.

**tiempo.com / Meteored** ([lanzarote.htm](https://www.tiempo.com/lanzarote.htm), [arrecife.htm](https://www.tiempo.com/arrecife.htm), `famara.htm`)
- Title «El Tiempo en {X}. Predicción a 14 días - Meteored España»; se ven unos 7-8 días.
- H2 «El tiempo en {X} hoy / mañana» y **una frase de resumen**. URLs `/{lugar}.htm`, `/por-horas`, `/hoy`, `/manana`, `/fin-de-semana`.
- Sin enlaces entre localidades de Lanzarote; muchos módulos ajenos (noticias, vídeo).

**eltiempo.es** ([Arrecife EN](https://en.eltiempo.es/arrecife.html))
- 14 días y vista por horas; páginas hasta de barrio. La versión EN está a medio traducir. Anuncios (DoubleClick) y widgets patrocinados.

**tiempo3.com** ([Lanzarote](https://www.tiempo3.com/europe/spain/canary-islands/lanzarote))
- H1 «El tiempo en Lanzarote, España». Vistas por parámetro (`?page=14`, `month&month=October`), páginas por pueblo, texto SEO largo, FAQ, bloques de afiliados.
- Datos cargados por JS (vacíos al leerlo). Es el dominio que más aparece en las búsquedas de «tiempo» en español hechas con WebSearch.

**meteoblue** ([Arrecife](https://www.meteoblue.com/es/tiempo/semana/arrecife_españa_2521570))
- 14 días, meteograma, multimodelo, mar y surf, 21 idiomas. Sin H1 visible. Pop-up anti-adblock.

**wetter.com / wetter.de** ([wetter.com Lanzarote](https://www.wetter.com/spanien/kanarische-inseln/lanzarote/TRSM00000246.html), [wetter.de](https://www.wetter.de/spanien/wetter-lanzarote-1637116/wetterprognose.html))
- wetter.de: **resúmenes en texto** (hoy, mañana, 7 y 14 días). wetter.com: página de isla con 8 localidades, 16 días, clima y «beste Reisezeit».
- Páginas muy pesadas (más de 125 000 caracteres de texto), anuncios.

### Viento, oleaje y surf

**Windfinder** ([Famara](https://es.windfinder.com/forecast/famara))
- H1 «Previsiones del viento, del oleaje y del tiempo {spot}». Tabla cada 3 h (GFS). Cientos de spots, bloque «Otros spots cerca», breadcrumb.
- Ninguna interpretación del dato.

**Windguru / Windy** — Sin contenido sin JS; URLs numéricas. Posicionan por marca y enlaces, no por HTML. *Inferencia*: no son un modelo replicable para un sitio nuevo.

**surf-forecast.com** ([Famara](https://www.surf-forecast.com/breaks/Playade-Famara_1/forecasts/latest/six_day))
- 38 spots en Lanzarote, subpáginas `/tides`, `/seatemp`. 16 días, estrellas, resumen «mejor día de la semana». Anuncios y suscripción.

### Mareas y temperatura del agua

**tablademareas.com** ([Arrecife](https://tablademareas.com/es/islas-canarias/arrecife-lanzarote/prevision/mareas))
- Title **con datos del día**: «Pleamar hoy 01:37 y 13:56 · Mareas en Arrecife…». H1 «HORARIO DE MAREAS Arrecife». 7 días, coeficiente, FAQ, unas 20 localidades cercanas enlazadas, unos 50 idiomas.
- *Inferencia*: el title con datos de hoy es una buena idea para CTR, pero **exige HTML generado en el servidor** (con prerender estático quedaría caducado).

**tide-forecast.com / tideschart / tides4fishing** — Página por lugar, hasta 30 días. Poca cobertura de pueblos de Lanzarote en tide-forecast.

**Familia seatemperatu.re / cabaigne.net / meerestemperatur.de / temperaturadomar.pt** — La misma plantilla en varios idiomas, 13 localidades de Lanzarote, mareas a 14 días; slugs rotos («-rzola»). Que sean del mismo operador es inferencia.

**seatemperature.info** ([Lanzarote](https://seatemperature.info/lanzarote-water-temperature.html))
- **Compara dentro de la isla** («más cálido en El Golfo, más frío en Arrecife; más ola en Famara»). Es lo más parecido al «Dónde ir» de Lanzamet, pero solo para el agua.

### Competidores de nicho directos (los más parecidos a Lanzamet)

| Sitio | Qué hace (verificado por el investigador de keywords) | Por qué importa |
|---|---|---|
| **canaryforecast.com** | Páginas por playa y pueblo, clima mensual (`/es/lanzarote/weather-november/`), calima, temperatura del mar, versiones `/es/`, `/en/`, `/de/`; monetiza con alquiler de coches ([fuente](https://canaryforecast.com/es/lanzarote/)) | Es la arquitectura que Lanzamet necesita; ya aparece en calima, agua y clima mensual |
| **canarias.app** | Mareas por puerto y playa (`/mareas/playa/famara/`), calima, surf, FAQ, aviso «no válido para navegación» ([fuente](https://canarias.app/mareas/lanzarote/)) | Primero en Bing para «oleaje lanzarote» |
| calimacanarias.com | Calima en Canarias | Domina «calima lanzarote» en Bing |
| vientoplaya.es, tuplayahoy.es, verplayas.com, aurabeach.app, divermar.com | Playas sin viento / playa hoy | Compiten con `/donde-ir` |

### Medios locales

- [La Voz de Lanzarote](https://www.lavozdelanzarote.com/tag/tiempo), [Gazette Life](https://gazettelife.com/news/calima-alert-on-lanzarote-today-2/), rtvc.es, Diario de Avisos: noticias de calima, avisos y oleaje, **sin herramienta**. Son **socios potenciales de enlaces** más que competidores (ver `12-oportunidades-crecimiento.md`).

## 3. Tabla comparativa

| Competidor | Arquitectura | Contenido | Fortalezas | Debilidades | Amenaza para Lanzamet |
|---|---|---|---|---|---|
| AEMET | Municipio + playa, 7 idiomas | 7 días, playas 3 días, avisos | Autoridad oficial | Sin texto, sin enlaces entre playas, técnica antigua | Alta en cabeza y avisos (no competir de frente) |
| tiempo.com | `/{lugar}.htm` + vistas | 7-14 días, frase resumen | Escala, resumen | Promete 14 días y muestra ~7; sin enlaces en la isla | Alta en cabeza |
| eltiempo.es | `/{lugar}.html`, barrios | 14 días, por horas | Cobertura | Anuncios, EN a medias | Media |
| tiempo3.com | Isla + pueblos + `?page=` | 14 días, mes, FAQ | Muchas variantes | Datos por JS, texto genérico, afiliados | Media |
| Windfinder | `/forecast/{spot}` | Tabla cada 3 h | Muchos spots | Cero interpretación | Alta en «viento» |
| surf-forecast | `/breaks/{spot}/…` | 16 días, mareas, agua | 38 spots, resumen del mejor día | Anuncios, solo surf | Media |
| tablademareas | `/{región}/{lugar}/prevision/mareas` | Mareas, coeficiente, FAQ | Title con datos de hoy, enlaces cercanos | Solo mareas | Alta en «mareas» |
| seatemperature.* / familia seatemperatu.re | Lugar y mes | Agua, mareas | Comparativa dentro de la isla | Plantillas genéricas | Media |
| wetter.com / wetter.de | Isla + 8 localidades + clima | 16 días, textos, Reisezeit | Texto natural | Pesadas, anuncios | Alta en DE |
| weather2travel / holiday-weather | Isla + mes + resort | Clima, FAQ | Intención de viaje | Afiliados, datos incoherentes | Alta en EN mensual |
| **canaryforecast.com** | Isla, playas, meses, ES/EN/DE | Tiempo, agua, calima, clima | Arquitectura programática completa | Monetización con afiliados | **Muy alta (competidor directo)** |
| **canarias.app** | Mareas por playa, calima, surf | Mareas, oleaje | Primero en «oleaje» (Bing) | — | **Muy alta** |

## 4. Lo que comparten los que aparecen (requisitos mínimos para competir)

1. **Una URL indexable por lugar**, con el nombre en title y H1. Lo cumplen todos (verificado). Ninguno posiciona «Famara» desde una página genérica.
2. **Title con plantilla** «El tiempo en {X}» + horizonte + marca, o con datos del día.
3. **Horizonte de 7 a 16 días y vista por horas** para las búsquedas genéricas.
4. **Enlaces a lugares cercanos** (Windfinder, tablademareas, surf-forecast, wetter.com).
5. **FAQ o texto** en mareas y clima.
6. **Páginas por mes** para inglés y alemán.
7. **HTML servido con contenido**: los de nicho que aparecen sirven HTML estático (inferencia del investigador; Windguru y Windy son la excepción por su marca).

## 5. Cómo puede diferenciarse Lanzamet (inferencias con evidencia)

| Diferencia | Evidencia de que es un hueco | Cómo explotarla sin cambiar el diseño |
|---|---|---|
| **El día explicado en palabras, zona a zona** | Solo Meteored tiene una frase genérica; wetter.de resúmenes sin zonas; AEMET adjetivos de playa | Prerenderizar el texto estable de cada zona y, en el navegador, el veredicto. Añadir una frase de resumen de isla en la home (ya existe la lógica en `core/insights/island.insight.ts`) |
| **Dónde hace menos viento / mar más tranquilo hoy** | Solo seatemperature.info compara dentro de la isla, y solo el agua | `/viento` con sección «Dónde hay menos viento hoy» y `/donde-ir`; ya calculado en `features/sea` («zonas de menos a más olas») |
| **Viento + mar + marea por playa en una vista** | AEMET lo tiene sin enlazar ni explicar; surf-forecast en clave surfista | `/mar/{zona}` y `/tiempo/{zona}` |
| **Calima explicada y en vivo** | Solo noticias y nichos | `/calima` con dato CAMS, umbral explicado y enlace a avisos |
| **Transparencia de fuentes y método** | Ningún competidor explica qué celda del modelo usa ni que la marea es estimada | Página `/sobre` con la metodología del README (celdas de mar elegidas a mano, validación de mareas del 22-10-2026) |
| **Bilingüe de verdad, sin anuncios, ligera, accesible** | eltiempo.es EN a medias; anuncios en eltiempo.es, meteoblue, surf-forecast, wetter.com; Lighthouse de Lanzamet: accesibilidad 100 | URLs `/en/` con traducción revisada; mantener sin anuncios |
| **Coherencia de datos** | tiempo.com promete 14 días y muestra ~7; holiday-weather con datos incoherentes | No prometer en el title lo que la página no da (no usar «14 días») |

## 6. Accesibilidad y sencillez frente a la competencia

- AEMET declara WCAG 1.0 AA, pero el texto llegó con codificación rota y algunos iconos de aviso no tienen texto (verificado).
- Windguru y Windy no dan contenido sin JS (verificado).
- Tablas densas (Windfinder cada 3 h, surf-forecast a 16 días) exigen saber leer el dato. Nadie traduce «8 kts NE» a «brisa suave, bueno para bañarse» (inferencia).
- Lanzamet: Lighthouse accesibilidad 100 en `/`, `/mar`, `/zonas` (laboratorio, 27-10-2026). La sencillez es real, pero hoy **no es visible para buscadores** (ver `02` T-06, T-07).
