# Auditoría de consumo de APIs

Fecha: 23-10-2026 · Estado del código: fase 4 (rama `main`) · Diagnóstico hecho antes de cambiar nada. **El 24-10-2026 se aplicó parte de la recomendación: ver [Estado](#estado-24-10-2026).**

## Estado (24-10-2026)

Aplicado al preparar el despliegue en Cloudflare:

| Recomendación | Decisión | Dónde |
|---|---|---|
| Caché compartida de Open-Meteo en el API propio | **Hecha, sin Cron ni KV.** `/api/open-meteo/{forecast,marine,air-quality}` reenvía la consulta de la web y guarda la respuesta 10, 30 o 60 min en memoria y en la Cache API de Cloudflare. La primera visita de cada centro de datos la rellena; las demás no llegan a Open-Meteo | `server/open-meteo.ts`, `server/edge-cache.ts`, `OpenMeteoClient` |
| Open-Meteo directo como reserva | **Hecha.** Si el API no responde, falla, devuelve algo inesperado o tarda más de 8 s, el navegador pregunta a Open-Meteo como antes | `OpenMeteoClient.fetchList` |
| Caché de AEMET global, no por instancia | **Hecha** con la misma caché en dos niveles; se conserva la copia de hasta 2 h si AEMET falla | `server/api.ts` |
| Pausar la renovación con la pestaña oculta | **Hecha.** El pulso de 15 min se detiene con la pestaña oculta y se reanuda al volver | `ClockStore.refreshBeat` |
| Cron Trigger + KV con actualización programada | **No por ahora.** Añade un servicio (KV) que crear y mantener a mano, y la Cache API ya deja el consumo en unas pocas peticiones por hora y centro de datos. Merece la pena si el tráfico llega a miles de visitas al día o si se quiere el mismo dato en todos los centros de datos | — |
| Un único `GET /api/isla` | **No.** Cambiaría el formato de las respuestas y los mapeadores; con tres respuestas cacheadas en el borde la ganancia es pequeña | — |
| Petición de polvo opcional | **No**, como ya preveía la auditoría: ahorro pequeño para su complejidad | — |

Resultado: una visita nueva hace como mucho 5 peticiones al Worker y ninguna a Open-Meteo mientras la copia del centro de datos esté fresca. Open-Meteo recibe del orden de 6 + 2 + 1 peticiones por hora y centro de datos activo, vengan los visitantes que vengan. La Cache API solo funciona con dominio propio: en `*.workers.dev` cada instancia guarda su copia en memoria.

Respuesta corta: **sí, cada visitante nuevo genera sus propias llamadas a Open-Meteo** (3 peticiones, una por servicio). Después ya no pide nada más: navegar, cambiar de zona o de hora es gratis, y una recarga dentro del plazo de caché también. La caché es **por navegador, no compartida**: mil visitantes son al menos tres mil peticiones. Con el tráfico actual no hay problema. El riesgo aparece con unos cientos de visitantes al día si Open-Meteo cuenta las llamadas por aplicación y no por IP, y con wifis compartidas (hoteles) en cualquier caso. La solución a largo plazo es una **caché compartida con actualización programada en el API propio** (Cloudflare Worker + Cron), que deja el consumo en ~80 peticiones al día a Open-Meteo, vengan los visitantes que vengan.

---

## 1. Qué se pide al abrir la web

Medido en Chrome con un perfil vacío (sin `localStorage` ni caché HTTP), abriendo `/`:

| # | Destino | Contenido | Puntos | Variables | Tamaño (JSON) |
|---|---|---|---|---|---|
| 1 | `api.open-meteo.com/v1/forecast` | Tiempo actual, 7 días diarios, horario | 7 zonas | 9 actuales + 10 horarias + 8 diarias = 27 | 68,8 KB |
| 2 | `marine-api.open-meteo.com/v1/marine` | Oleaje, mar de fondo, agua, nivel del mar | 7 puntos de mar | 8 horarias, 1 día pasado + 3 | 36,3 KB |
| 3 | `air-quality-api.open-meteo.com/v1/air-quality` | Polvo (calima) | 7 zonas | 1 horaria, 5 días | 14,6 KB |
| 4 | `/api/avisos` (API propio) | Avisos de AEMET | — | — | 0,3 KB |
| 5 | `/api/observaciones` (API propio) | Estaciones de AEMET | — | — | 1,9 KB |

Las tres peticiones a Open-Meteo traen **toda la isla de una vez**: el cliente (`OpenMeteoClient`) pide las 7 zonas en una sola URL por servicio, y todas las pantallas leen de esas tres respuestas. Las peticiones simultáneas se comparten (`ResponseCache`): aunque Hoy, el selector de zonas y las recomendaciones pidan a la vez, sale una sola petición por servicio.

## 2. Peticiones por visitante

| Escenario | Open-Meteo | API propio (AEMET) |
|---|---|---|
| Primera visita del día | **3** | 2 |
| Recargar (F5) o abrir otra pestaña dentro del plazo de caché | 0 | 0–2 (caché HTTP de 5–10 min) |
| Dos visitas separadas más de 1 h | 6 | 4 |
| Pestaña abierta 8 h | ~20–27 | ~48 (avisos cada 15 min, observaciones cada 30 min) |
| Pestaña abierta 24 h (olvidada en segundo plano) | ~58–80 | ~144 |

Cálculo de la pestaña abierta: los stores vuelven a leer cada 15 min (`ClockStore.quarterKey`) y la caché decide si eso sale a la red. Con caducidad de 30 min, el tiempo se renueva cada 30–45 min (16–32 veces en 8–24 h, más la carga inicial). El mar, cada 60–75 min, y el polvo, cada 3 h–3 h 15 min. Chrome sigue ejecutando el temporizador en pestañas ocultas (como mucho una vez por minuto), así que una pestaña olvidada sigue pidiendo.

## 3. Qué pasa al cambiar de zona, de página o de hora

Medido en el mismo navegador, después de la primera carga:

| Acción | Peticiones nuevas |
|---|---|
| Cambiar de zona (favorita o selector) | 0: las 7 zonas ya están en las respuestas |
| Elegir una hora en «Próximas horas» | 0: se lee de la previsión horaria cargada |
| Ir a Zonas, Mar o Dónde ir | 0 |
| Esperar sin hacer nada (menos de 30 min) | 0 |
| Pulsar «Actualizar» antes de 1 min | 0 (`MIN_REVALIDATE_MS`) |
| Pulsar «Actualizar» pasado 1 min | 3 a Open-Meteo + 2 al API propio |
| Cambiar de idioma o de tema | 0 |

## 4. Caché: dónde vive y quién la comparte

| Capa | Dónde | Duración | ¿Compartida entre visitantes? |
|---|---|---|---|
| `ResponseCache` en memoria | Pestaña | 30 min tiempo · 60 min mar · 3 h polvo · 10 min avisos · 20 min observaciones | No |
| `ResponseCache` en `localStorage` (`qth.cache.om-*`, ~114 KB) | Navegador (todas sus pestañas) | Las mismas, solo Open-Meteo | No |
| Caché HTTP del navegador para `/api/*` | Navegador | `max-age` 300 s avisos, 600 s observaciones | No |
| Memoria del API propio (`server/api.ts`) | Instancia del servidor | 10 min avisos, 20 min observaciones (y copia de hasta 2 h si AEMET falla) | **Sí**, entre los visitantes que atiende esa instancia |
| Open-Meteo | — | No envía `Cache-Control`: el navegador no la guarda por su cuenta | — |

Conclusión: **la caché de Open-Meteo es individual por navegador**. La de AEMET sí es compartida, porque pasa por el API propio. Un matiz: en Cloudflare Workers la memoria es de cada *isolate*, y puede haber varios por centro de datos. Así que «compartida» quiere decir «compartida dentro de cada instancia», no global.

## 5. Frecuencia real de actualización

| Dato | Modelo y actualización en origen | Caché en la app | Antigüedad máxima que puede ver el visitante |
|---|---|---|---|
| Tiempo | DWD ICON, nueva pasada cada 3 h; `current` en pasos de 15 min | 30 min | ~45 min (30 de caducidad + 15 hasta el siguiente ciclo) |
| Mar | MFWAM cada 12 h; SMOC (nivel del mar) y temperatura del agua cada 24 h | 60 min | ~75 min, de sobra para modelos que cambian cada 12–24 h |
| Polvo | CAMS global cada 12 h | 3 h | ~3 h 15 min |
| Avisos | AEMET publica al cambiar la situación | 10 min servidor + 5 min navegador | ~15–25 min |
| Observaciones | AEMET, horarias | 20 min servidor + 10 min navegador | ~30 min, más el retraso propio de AEMET |

Las caducidades están bien elegidas. Bajar la del tiempo apenas daría información nueva: el modelo solo cambia cada 3 h y `current` cada 15 min.

## 6. Límites y condiciones de los proveedores

Consultado el 23-10-2026 en las páginas oficiales.

**Open-Meteo, API gratuita** ([condiciones](https://open-meteo.com/en/terms), [precios](https://open-meteo.com/en/pricing)):

- Solo **uso no comercial**: menos de **10 000 llamadas al día, 5 000 por hora y 600 por minuto**. La tabla de planes añade **300 000 al mes**.
- «No comercial» incluye webs privadas o sin ánimo de lucro **sin suscripciones ni publicidad**; las donaciones voluntarias están permitidas. Esta web cumple hoy. **Con anuncios o suscripción haría falta un plan de pago**: Standard, 1 M de llamadas al mes; Professional, 5 M. Los precios no aparecían en el texto consultado.
- Los límites se aplican **«por direcciones IP y aplicación»**. Recomiendan Cloudflare Workers porque allí aplican el límite por usuario de Cloudflare. Se reservan el derecho a bloquear sin aviso aplicaciones o IP que abusen.
- **Qué es una llamada**: normalmente una petición HTTP, pero las que piden **más de 10 variables** o **más de 2 semanas** «por ubicación» cuentan como varias, con fracciones (15 variables = 1,5 llamadas). No documentan cómo cuentan las peticiones con varias ubicaciones. Su blog sugiere que equivalen a hacer una petición por ubicación.
- Licencia CC BY 4.0, con atribución a Open-Meteo y al proveedor del modelo. Ya se cumple en el pie de cada página y en Ajustes.
- Sin garantía de disponibilidad en la API gratuita.

**AEMET** ([OpenData](https://opendata.aemet.es/centrodedescargas/info), [nota legal](https://www.aemet.es/es/nota_legal)):

- Reutilización libre, comercial o no, citando a AEMET como fuente. Prohibido desnaturalizar la información o sugerir que AEMET patrocina la web.
- OpenData contabiliza los accesos por clave de API, pero las páginas consultadas **no publican un límite numérico**. La nota legal solo prohíbe «sobrecargar» el servicio. El API propio pide como mucho 7 estaciones cada 20 min y 2 ficheros de avisos cada 10 min por instancia, una carga despreciable.
- Los avisos (RSS y CAP) no requieren clave.

**Cloudflare Workers, plan gratuito** (para el API propio; [límites](https://developers.cloudflare.com/workers/platform/limits), [precios](https://developers.cloudflare.com/workers/platform/pricing/)): 100 000 peticiones al día y 10 ms de CPU por petición (la espera de red no cuenta). KV gratuito: 100 000 lecturas y 1 000 escrituras al día.

## 7. Cuántos visitantes aguanta la arquitectura actual

### Supuestos

1. **Visitante medio**: 1,3 cargas «en frío» al día. La mayoría entra una vez; algunos vuelven pasada la caducidad. Las visitas dentro del plazo de caché no cuentan.
2. **Peso de cada carga en frío** (3 peticiones), en dos lecturas de las reglas de Open-Meteo:
   - **Optimista**: 1 llamada por petición HTTP → **3 llamadas**.
   - **Conservadora**: cada ubicación cuenta y se aplica el recargo por variables. Tiempo: 7 × 27/10 = 18,9. Mar: 7 × 1 = 7. Polvo: 7 × 1 = 7. Total, **≈ 33 llamadas**.
3. **Ámbito del límite**: o por IP del visitante (el navegador llama directamente a Open-Meteo, así que cada visitante usa su propia cuota), o **por aplicación** (todo el tráfico de la web, identificado por su origen, suma en una sola cuota). Las condiciones dicen «IP y aplicación» sin más detalle, y en cualquier caso el límite de 10 000 al día es una condición de uso de la aplicación.

### Resultado

| Ámbito del límite | Lectura | Llamadas por visitante y día | Visitantes/día con 10 000 llamadas | Picos (600 llamadas/min) |
|---|---|---|---|---|
| Por aplicación | Optimista | 3 × 1,3 ≈ 3,9 | **≈ 2 500** | 200 cargas en frío por minuto |
| Por aplicación | Conservadora | 33 × 1,3 ≈ 43 | **≈ 230** | 18 cargas en frío por minuto |
| Por IP | Cualquiera | — | Sin límite práctico: cada visitante tiene su cuota | — |

En el caso «por IP», el problema son las **IP compartidas**. Un hotel con una sola salida a internet, una oficina o la CGNAT de un operador móvil (muy común en 4G/5G) suman a todos sus usuarios. Con la lectura conservadora bastan **~300 cargas en frío desde la misma IP** para agotar el día. En una isla turística, el wifi de un hotel grande es un caso realista.

El límite mensual (300 000) equivale a 10 000 al día, así que no cambia las cifras.

## 8. Riesgos

| Riesgo | Probabilidad hoy | Impacto |
|---|---|---|
| Superar 10 000 llamadas al día si Open-Meteo agrega por aplicación | Baja con el tráfico actual; **media** a partir de ~200–2 500 visitantes al día, según cómo pondere | La previsión deja de cargar para todos (error 429) hasta el día siguiente |
| Pico de tráfico (enlace en redes o en prensa local) que supere 600 llamadas/min | Baja, pero repentina | Errores durante minutos; la web muestra el aviso de error y los últimos datos guardados de cada navegador |
| Wifi de hotel o CGNAT con muchos usuarios | Media en temporada alta | Bloqueo solo para los usuarios detrás de esa IP |
| Pestañas olvidadas abiertas que siguen pidiendo cada 30–60 min | Alta, pero de impacto pequeño | Hasta ~80 peticiones al día por pestaña |
| Bloqueo sin aviso por abuso | Muy baja (el uso es legítimo y está cacheado) | Total |
| Pasar a uso comercial (anuncios) sin plan de pago | Depende de decisiones futuras | Incumplimiento de las condiciones |

**No hay riesgo con AEMET**: el API propio ya hace de caché compartida.

## 9. Recomendación a largo plazo

**Caché compartida con actualización programada, en el API propio que ya existe** (`server/api.ts`, pensado para Cloudflare Workers):

1. **Un Cron Trigger cada 30 min** (y cada 60 y 180 min para el mar y el polvo) pide a Open-Meteo las mismas tres URL de hoy y guarda el resultado en Workers KV o en la Cache API. **Open-Meteo recibe ~80 peticiones al día en total** (48 + 24 + 8), unas 1 100 llamadas en la lectura conservadora: el 11 % del límite gratuito, **con independencia del número de visitantes**. Además, Open-Meteo aplica el límite por usuario de Cloudflare, que es justo su recomendación.
2. **Un endpoint `GET /api/isla`** devuelve en una sola respuesta tiempo, mar, polvo, avisos y observaciones, con `Cache-Control: public, max-age=300, stale-while-revalidate=1800`. Cada visita nueva cuesta **1 petición** al Worker, en vez de 3 a Open-Meteo y 2 al API.
3. El frontend solo cambia su cliente: `OpenMeteoClient` lee de `/api/isla`, y los mapeadores, los stores y la interfaz siguen igual, porque el formato de las respuestas no cambia. Conviene mantener Open-Meteo directo como **reserva** si el API no responde, así la web no depende de un único punto.
4. Llevar también la caché de AEMET a KV o a la Cache API, para que sea global y no por instancia.

**Capacidad resultante** en el plan gratuito de Cloudflare: 100 000 peticiones al día al Worker. Con 1–2 peticiones por visitante, **~50 000–100 000 visitantes al día**, más todo lo que sirva la caché HTTP del navegador. KV: ~80 escrituras al día (límite 1 000) y una lectura por petición (límite 100 000).

**Alternativas descartadas o secundarias**:

| Alternativa | Por qué no como solución principal |
|---|---|
| Caché en el Worker sin cron (se rellena con la primera visita) | Funciona y es más simple, pero la Cache API es por centro de datos: varias ubicaciones de Cloudflare harían cada una sus propias peticiones. Sigue siendo una mejora enorme y puede ser un primer paso. |
| JSON estático generado por GitHub Actions y publicado con la web | El cron de Actions se retrasa a menudo decenas de minutos y desplegar cada 30 min es pesado. |
| Backend propio (VPS) con base de datos | Más mantenimiento y coste sin ventaja para un único conjunto de datos de la isla. |
| Plan de pago de Open-Meteo | Solo si la web pasa a ser comercial. Con la caché compartida no hace falta por volumen. |

**Mejoras pequeñas en el frontend**, compatibles con lo anterior, si se quiere ganar margen antes:

- Pausar la renovación automática con la pestaña oculta (`document.visibilityState`) y renovar al volver si los datos han caducado. Esto elimina el consumo de las pestañas olvidadas.
- Hacer opcional la petición de polvo cuando no hay calima en la previsión de días anteriores. Ahorro pequeño; probablemente no compense la complejidad.

Ninguno de estos cambios se ha aplicado: quedan pendientes de revisar esta auditoría.

## 10. Cómo se ha medido

- **Peticiones**: Chrome sin interfaz con un perfil nuevo, recursos registrados con `performance.getEntriesByType('resource')` en cada acción (primera visita, espera, cambio de zona, de hora y de página, recarga, nueva pestaña, «Actualizar»).
- **Tamaños**: descarga directa de las tres URL que genera `OpenMeteoClient`. Open-Meteo no envía `Timing-Allow-Origin`, así que el navegador no expone el tamaño de las respuestas de otro origen.
- **Caducidades y ciclos**: `open-meteo.client.ts`, `response-cache.ts`, `clock.store.ts`, `official.sources.ts` y `server/api.ts`.
- **Límites**: páginas oficiales de Open-Meteo, AEMET y Cloudflare, enlazadas arriba, consultadas el 23-10-2026.
