# 12 · Oportunidades de crecimiento

Ordenadas por relación entre potencial (inferido) y esfuerzo. Ninguna cifra de tráfico: no hay datos verificables (ver `13`).

## 1. Las 10 oportunidades principales

| # | Oportunidad | Por qué (evidencia) | Página | Tarea |
|---|---|---|---|---|
| 1 | **Mareas por localidad** («mareas lanzarote arrieta / famara / órzola / playa blanca») | Autocompletado con 9 lugares; en Bing compiten páginas por localidad (tablademareas, tideschart, canarias.app). Lanzamet ya tiene un punto de mar propio por zona | `/mar/{zona}` | B-11 |
| 2 | **Tiempo por localidad** («tiempo playa blanca / puerto del carmen / famara / costa teguise») | Fuerte en ES, EN y DE; todos los competidores tienen página por lugar | `/tiempo/{zona}` | B-11 |
| 3 | **Calima** | SERP de Bing solo con sitios de nicho; picos por episodios; Lanzamet ya tiene el dato CAMS | `/calima` | B-16 |
| 4 | **Playas sin viento / dónde ir hoy** | Es la propuesta diferencial de Lanzamet; en Bing compiten 5 o más nichos; demanda en ES, EN («sheltered») y DE («windstille Strände») | `/donde-ir`, `/viento` | B-07, B-12 |
| 5 | **Viento en Lanzarote hoy** | Alta demanda; los competidores (Windfinder, Windguru) no interpretan nada | `/viento` | B-12 |
| 6 | **Inglés: clima por mes** («lanzarote weather november») | 1,69 M de turistas británicos al año; el autocompletado de finales de octubre ordena octubre y noviembre primero | `/en/climate/{month}` | B-18, B-19 |
| 7 | **Temperatura del agua** (hoy y por mes, ES/EN/DE) | Demanda en los tres idiomas; dominada por dominios de nombre exacto, pero con contenido pobre | `/mar#temperatura-agua`, `/clima/{mes}` | B-21, B-19 |
| 8 | **Oleaje y estado del mar** (incluido Órzola–La Graciosa) | canarias.app, primero en Bing, es un nicho; «estado del mar entre lanzarote y la graciosa» aparece en el autocompletado | `/mar`, `/mar/orzola` | B-07, B-22 |
| 9 | **«Is Lanzarote windy?» / «Por qué hace viento»** | PAA de Bing; guías estables enlazables | Guías | B-20 |
| 10 | **Avisos** | Picos fuertes; eltiempo.es posiciona con una página agregadora | `/avisos` | B-17 |

La cabeza «tiempo en Lanzarote» queda fuera del top 10 a propósito: hay que optimizar la home (B-07), pero competir con AEMET y Meteored no es realista a corto plazo. Las páginas de zona y de nicho son las que pueden construir autoridad.

## 2. Victorias rápidas (menos de 1 día cada una)

1. Español por defecto en cada URL (B-01a).
2. robots.txt y sitemap (B-02).
3. Search Console y Bing (B-06).
4. Cerrar `workers.dev` (B-04).
5. Caché inmutable (B-14).
6. Titles y descriptions por ruta (parte de B-07, sin tocar el diseño).

## 3. Ventaja competitiva que hay que hacer visible

- **Explicación en palabras** («Mar en calma, olas de unos 40 cm, agua a 23 °C»): ya existe; falta que esté en URLs indexables y en el HTML.
- **Comparativa dentro de la isla**: «dónde hay menos viento / mar más tranquilo» ya se calcula en Mar y Dónde ir.
- **Honestidad del método**: celdas de modelo elegidas a mano, marea validada contra una predicción armónica (22-10-2026). Nadie más lo explica → `/sobre`.
- **Sin anuncios, ligera, accesible** (Lighthouse accesibilidad 100).

## 4. Enlaces y menciones legítimas

Sin compra de enlaces ni intercambios. Ideas con valor real para cada socio:

| Tipo | Ejemplos (observados en la investigación) | Propuesta de valor |
|---|---|---|
| Medios locales | La Voz de Lanzarote, Lancelot Digital, Gazette Life (EN), Diario de Lanzarote | Fuente citable en noticias de calima, viento y oleaje («según LanzaMet, hoy el norte…»), con metodología abierta |
| Webcams enlazadas | Ayuntamiento de Haría (Órzola, La Garita), in2theBeach (Famara), Lanzarote Webcam, SkylineWebcams | Lanzamet ya les envía tráfico y les da crédito; pedir un enlace recíproco «previsión de esta playa» |
| Escuelas de surf, kite y windsurf (Famara, Costa Teguise) | — | Enlazar `/mar/famara` o `/viento` como herramienta para sus alumnos |
| Clubes náuticos, cofradías y navegación a La Graciosa | — | Sección del estrecho (con la advertencia de que no sirve para navegar) |
| Comunidades | Grupos de residentes, foros de viajeros británicos (TripAdvisor Lanzarote) | Solo participación genuina, nunca spam |
| Instituciones | Cabildo (lanzarotesmart), turismo de Lanzarote | Recurso gratuito y sin anuncios para visitantes |
| Fuentes de datos | Open-Meteo (vitrina de proyectos) | Si existe un listado público de proyectos, solicitar la inclusión |

## 5. Ideas descartadas (y por qué)

- Página por cada playa de la isla: comparten celdas de modelo; serían páginas sin datos propios.
- «Tiempo Lanzarote 14 días» sin tener 14 días: engañoso.
- `FAQPage` para ganar resultados enriquecidos: ya no existen.
- Contenido masivo generado por IA: sin valor diferencial y con riesgo.
