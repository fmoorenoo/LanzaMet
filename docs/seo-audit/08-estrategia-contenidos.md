# 08 · Estrategia de contenidos y SEO programático

## 1. Principio

Lanzamet ya genera **información útil y distinta cada hora** (veredicto, viento por zona, mar por zona, marea, calima, avisos). Lo que falta es:

1. **Contenido estable** que explique a buscadores, IA y visitantes nuevos qué es cada página y cómo leerla.
2. **URLs** donde ese contenido viva (ver `05`).

No hace falta un blog ni volumen de texto. Hace falta poco texto, propio, exacto y bien colocado.

## 2. Contenido estable frente a dinámico

| Tipo | Ejemplos | Dónde se genera | Indexación |
|---|---|---|---|
| **Estable** (cambia al editar) | H1, intro de página, «Sobre esta zona», cómo se calcula, explicaciones (Beaufort, marea estimada, calima), guías, clima mensual | Prerender (HTML) | Ideal: siempre igual y verificable |
| **Semiestable** (cambia por días) | Avisos activos, «sin avisos ahora» | Navegador (y quizá borde, fase 3) | Google lo ve al renderizar |
| **Dinámico** (cambia por horas) | Temperatura, viento, mar, marea, veredicto, «Dónde ir» | Navegador | Google lo ve; no se prerenderiza |

Regla: **nunca** escribir en el HTML estático un dato que caduque («hoy 24 °C»).

## 3. Contenido diferencial por zona (borradores de datos, no de prosa)

Estos datos ya existen en `src/app/core/data/locations.ts`, `webcams.ts` y el README. Son la base del bloque «Sobre esta zona» (80-150 palabras por zona, escritas a mano, revisadas por alguien que conozca la isla).

| Zona | Municipio | Costa | Punto de mar (distancia) | Comparte celda de tiempo con | Estación AEMET («Medido») | Webcam | Rasgo para el texto |
|---|---|---|---|---|---|---|---|
| Puerto del Carmen | Tías | Sur | 28,875 / −13,625 (7 km) | — | Aeropuerto (C029O) | Playa Grande | Playa Grande; resguardada del alisio |
| Arrecife | Arrecife | Sureste | 28,875 / −13,542 (10 km) | Costa Teguise | Granja Cabildo (C029R) | Castillo de San Gabriel | Capital; El Reducto |
| Playa Blanca | Yaiza | Sur | 28,875 / −13,792 (4 km) | — | Playa Blanca (C019V) | Playa del pueblo | La Bocaina, Fuerteventura enfrente; Papagayo cerca |
| Costa Teguise | Teguise | Este | 28,958 / −13,375 (12 km) | Arrecife | Granja Cabildo (C029R) | Las Cucharas | Expuesta al alisio (windsurf) |
| Famara | Teguise | Noroeste | 29,208 / −13,708 (18 km) | La Santa | No (Haría está tras el Risco) | in2theBeach | Surf, Risco de Famara |
| La Santa | Tinajo | Noroeste | 29,125 / −13,792 (13 km) | Famara | No (verificar: Tinajo está a 275 m) | No | El Quemao, oleaje propio |
| Órzola | Haría | Norte | 29,292 / −13,458 (8 km) | — | La Graciosa (C839X) | Ayto. de Haría | Puerto hacia La Graciosa |
| Arrieta | Haría | Este | 29,125 / −13,292 (17 km) | — | No (Haría 277 m, La Graciosa a 12 km) | La Garita (Ayto. de Haría) | Playa de La Garita, Punta Mujeres cerca |
| El Golfo | Yaiza | Oeste | 28,958 / −13,875 (5 km) | — | No | No | Arena negra, volcanes, atardecer |

Esto **es** contenido diferenciado: ningún competidor explica de qué celda del modelo sale su dato ni por qué una zona no tiene medida. Riesgo de duplicación bajo si cada texto se escribe a mano a partir de esta tabla (no con una plantilla de frases intercambiables).

Las zonas que comparten celda deben **decirlo** («el modelo no distingue Arrecife de Costa Teguise; verás los mismos valores de tiempo, pero el mar de cada una se lee en un punto distinto»). Es honesto, y además evita que Google vea dos páginas de tiempo casi idénticas como duplicadas sin explicación.

## 4. Bloques reutilizables (componentes de contenido)

| Bloque | Páginas | Contenido | Componente existente |
|---|---|---|---|
| Intro de página (1-2 frases) | Todas | Qué muestra y para quién | Nuevo, texto i18n |
| «Sobre esta zona» | `/tiempo/{zona}`, `/mar/{zona}` | Tabla de §3 en prosa | Nuevo |
| «Cómo leer esto» | `/mar`, `/viento`, `/calima` | Marea estimada, Beaufort agrupado, umbral de calima | Nuevo; textos ya en el README |
| «Mañana en {zona}» | `/`, `/tiempo/{zona}` | Resumen del día siguiente | Reutiliza `DayList` / `week.insight.ts` |
| «Zonas cercanas» | Páginas de zona | 2-3 enlaces | Nuevo (lista simple) |
| Fuentes y actualización | Todas | Ya existe | `DataCredit` |
| Preguntas frecuentes visibles | `/mar`, `/viento`, `/calima`, `/clima/{mes}` | 3-5 preguntas reales del autocompletado (ver `03`) | Nuevo (`<h2>`/`<h3>` + `<p>`; sin `FAQPage`) |

## 5. Preguntas frecuentes con demanda observada (para contenido visible)

Sacadas del autocompletado y de los PAA de Bing (`03`):

- ¿Por qué hace tanto viento en Lanzarote? → `/guias/viento-en-lanzarote`
- ¿Dónde hace menos viento hoy en Lanzarote? → `/viento`, `/donde-ir`
- ¿Hasta cuándo dura la calima? / ¿Qué es la calima? → `/calima`
- ¿A qué hora es la pleamar hoy en Lanzarote? → `/mar`
- ¿Qué temperatura tiene el agua en Lanzarote? → `/mar#temperatura-agua`
- ¿Cómo está el mar entre Órzola y La Graciosa? → `/mar/orzola`
- Is Lanzarote windy? / Why is Lanzarote a windy island? → `/en/guides/wind-in-lanzarote`
- Is November a good month to visit Lanzarote? → `/en/climate/november`

Cada respuesta: 40-80 palabras, la respuesta en la primera frase, con el dato o la fuente. Las respuestas que dependen del día se apoyan en el dato en vivo («Ahora mismo…» en el navegador) y en una explicación estable.

## 6. SEO programático: qué sí y qué no

| Conjunto | Nº de páginas | ¿Aporta información diferenciada? | Decisión |
|---|---|---|---|
| `/tiempo/{zona}` | 9 | Sí: celda, orientación, estación, webcam, datos propios | **Sí** |
| `/mar/{zona}` | 9 | Sí: punto de mar propio para cada zona (README) | **Sí** |
| `/clima/{mes}` | 12 | Sí, **solo** con normales reales (AEMET o ERA5) y temperatura del mar mensual con fuente | Sí, condicionado a la fuente |
| `/tiempo/{zona}/{día}` | 63 | No: caduca, mismo componente | **No** (parámetro + canonical) |
| `/clima/{zona}/{mes}` | 108 | No: el clima de la isla apenas difiere entre zonas con la resolución disponible | **No** |
| Playas sueltas (Papagayo, Las Cucharas, Playa Honda…) | Decenas | No: comparten celdas de modelo con una zona | **No** como URL; mencionarlas en el texto de su zona |
| Webcams | 1 | Poco (lista de enlaces externos) | P3, solo si se acompaña de valor propio |

**Riesgos de automatización masiva**: textos de plantilla con el nombre cambiado, `lastmod` falso, páginas sin datos para una zona. Criterio de aceptación de cada página programática: al menos 3 hechos propios verificables que no estén en la página hermana.

## 7. Oportunidades editoriales (long tail)

| Pieza | Keyword | Formato | Datos necesarios | Prioridad |
|---|---|---|---|---|
| Guía: el viento en Lanzarote (alisios, zonas resguardadas, verano) | por qué hace viento en Lanzarote, is Lanzarote windy | 600-900 palabras + enlace a `/viento` | Explicación general; opcional: % de horas con alisio por mes (ERA5) | P2 |
| Guía: cómo leemos la marea (y por qué es estimada) | pleamar bajamar Lanzarote, tabla de mareas | 400-600 palabras | README §Mareas (validación del 22-10-2026) | P2 |
| Guía: calima, qué es y cómo se mide | qué es la calima | Dentro de `/calima` | CAMS, umbral | P2 |
| Clima mes a mes | tiempo Lanzarote en {mes} | 12 páginas | Normales | P2 |
| Escala de Beaufort y estado del mar en palabras | escala Beaufort, estado del mar | Sección de `/viento` y `/mar` | Ya en el código (`wind.insight.ts`, `sea.insight.ts`) | P2 |

Fechas y autor: las guías llevan fecha de revisión visible («Revisado el …») y responsable (la página `/sobre`).

## 8. Frescura y actualización

- Dato vivo: ya se actualiza (30 min tiempo, 60 min mar, 10 min avisos).
- Texto estable: revisión trimestral; cambios de método → actualizar `/sobre` y la fecha.
- `sitemap.xml`: `lastmod` solo cuando cambie el texto estable.
- Mantener «Actualizado a las…» con `<time>`.

## 9. Riesgos YMYL

Mar, calima y avisos afectan a la seguridad. Mantener lo que ya hace bien el producto: «orientativo, no una garantía», marea estimada «no para navegar», enlaces a AEMET y a socorristas. En `/calima`, consejos de salud solo citando a la autoridad sanitaria.
