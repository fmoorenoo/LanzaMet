# ¿Qué tal hoy?

Web para entender en tres segundos cómo está el día en Lanzarote: tiempo, viento, mar, mareas y a qué zona ir. Gratuita, sin publicidad ni suscripciones. En español y en inglés.

Desde la fase 2 muestra **datos reales**: previsión meteorológica y marítima de Open-Meteo y avisos oficiales de AEMET. Los datos simulados de la fase 1 solo existen en la build de demostración (`npm run start:demo`) y en los tests; la build de producción no los incluye.

## Ejecutar

Requisitos: Node 24+ (el API ejecuta TypeScript directamente) y npm.

```bash
npm install
npm run api          # API propio en http://localhost:8787/api (avisos y observaciones de AEMET;
                     #   la clave de AEMET va en server/.dev.vars, ver más abajo)
npm start            # web en http://localhost:4200 (reenvía /api al API propio)
npm run start:demo   # web con datos simulados (escenarios, hora y red ajustables)

npm test             # tests unitarios de la web (Vitest)
npm run test:api     # tests del API (node:test, con ficheros reales de AEMET)
npm run typecheck:api
npm run verify:sources  # comprueba en vivo todas las fuentes para las 7 zonas
npm run lint
npm run build        # build de producción en dist/
```

Sin `npm run api` la web funciona igual con Open-Meteo; los avisos y las medidas de AEMET se muestran como no disponibles.

En la build de demo, `/?escenario=calima` (`alisio`, `calma`, `ventoso`, `calima`, `borrasca`), `/?lento` y `/?fallo` abren la demo en un estado concreto.

## Fuentes de datos

| Fuente | Qué aporta | Acceso | Actualización en la app | Licencia y atribución | Estado |
|---|---|---|---|---|---|
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Temperatura, sensación térmica, cielo (código WMO + nubosidad), probabilidad de lluvia, UV, viento, rachas y dirección; previsión horaria (48 h) y diaria (7 días); amanecer y atardecer | Navegador, sin clave, CORS abierto | Caché de 30 min | CC BY 4.0, «Weather data by Open-Meteo.com» con enlace junto a los datos. Uso no comercial gratuito (< 10 000 llamadas/día, 5 000/h, 600/min por IP) | ✅ Funciona |
| [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) | Altura, dirección y periodo del oleaje; mar de fondo; temperatura del agua; nivel del mar (marea estimada) | Navegador, sin clave | Caché de 60 min | CC BY 4.0; modelos de Météo-France (MFWAM, SMOC) | ✅ Funciona |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Polvo sahariano en superficie → calima | Navegador, sin clave | Caché de 3 h | CC BY 4.0; «Contiene información modificada del Copernicus Atmosphere Monitoring Service» | ✅ Funciona |
| [AEMET, avisos (RSS + CAP)](https://www.aemet.es/es/rss_info/avisos/esp) | Avisos oficiales del Plan Meteoalerta para Lanzarote (zona 659101) y su costa (659101C) | API propio (sin CORS en origen), sin clave | Caché de 10 min | Reutilización con cita de AEMET como fuente ([nota legal](https://www.aemet.es/es/nota_legal)) | ✅ Funciona |
| [AEMET OpenData](https://opendata.aemet.es/) | Observaciones horarias de las 7 estaciones de Lanzarote | API propio, **requiere clave** (solo en el servidor) | Caché de 20 min | Cita de AEMET como fuente | ✅ Funciona |
| [Puertos del Estado](https://www.puertos.es/) | Mareas oficiales, boyas, mareógrafos | — | — | — | ⛔ No integrado (ver abajo) |

Las atribuciones aparecen en el pie de cada página (Hoy, Zonas, Mar, Dónde ir) y, completas, en **Ajustes → De dónde salen los datos**.

### Modelos y resolución

- **Previsión**: `best_match` de Open-Meteo, que en Lanzarote corresponde a **DWD ICON** (comprobado el 22-10-2026 comparando la celda devuelta con `icon_seamless`). Open-Meteo baja la temperatura a la altitud real con un modelo digital del terreno de 90 m.
- **Mar**: Météo-France MFWAM (olas, 0,08°, cada 12 h), SMOC (nivel del mar y corrientes, 0,08°, cada 24 h) y su temperatura superficial (cada 24 h).
- **Polvo**: CAMS global (0,4°, cada 12 h). CAMS Europa no cubre Lanzarote: su dominio empieza en 30° N y responde «No data is available for this location».

### Puntos de consulta por zona

El tiempo se pide en las coordenadas de cada zona. Para el mar no sirve: el modelo marino enmascara todas las celdas que tocan la costa de Lanzarote, y una coordenada costera salta sola a la celda de mar más cercana. Así, Famara caía al norte de La Graciosa y El Golfo en una celda casi toda de tierra. Cada zona lee el mar en una celda elegida a mano: la celda de mar abierto más próxima en el lado al que mira su costa, verificada como celda de mar propia.

| Zona | Coordenadas | Celda del modelo del tiempo | Punto de mar abierto | Distancia |
|---|---|---|---|---|
| Puerto del Carmen | 28,921 / −13,668 | 28,946 / −13,681 | 28,875 / −13,625 | 7 km |
| Arrecife | 28,963 / −13,548 | 28,983 / −13,538 ¹ | 28,875 / −13,542 | 10 km |
| Playa Blanca | 28,863 / −13,830 | 28,876 / −13,769 | 28,875 / −13,792 | 4 km |
| Costa Teguise | 29,001 / −13,491 | 28,983 / −13,538 ¹ | 28,958 / −13,375 | 12 km |
| Famara | 29,116 / −13,557 | 29,120 / −13,604 | 29,208 / −13,708 | 18 km |
| Órzola | 29,223 / −13,450 | 29,218 / −13,469 | 29,292 / −13,458 | 8 km |
| El Golfo | 28,979 / −13,832 | 28,952 / −13,828 | 28,958 / −13,875 | 5 km |

¹ Zonas que comparten celda: el modelo no las distingue y muestran los mismos valores (salvo el ajuste de temperatura por altitud). No se inventan diferencias. Por eso, en la fase 3 se retiraron **Papagayo** y **La Santa**, que repetían las celdas de Playa Blanca y Famara: quien las tuviera guardadas como zona o favorita pasa a Playa Blanca y Famara (`RETIRED_LOCATIONS`). La pantalla Mar indica a cuántos kilómetros está el punto de mar abierto y que en la orilla las olas pueden ser distintas.

### Mareas: estimación, no tabla oficial

Se buscó una fuente oficial de pleamares y bajamares y no hay ninguna utilizable:

- **Puertos del Estado** no ofrece un API público documentado de predicción de marea. Las condiciones de su servicio de descarga prohíben ceder los datos a terceros, y su integración oficial son widgets en `iframe`, que romperían el diseño. Su servidor THREDDS/OPeNDAP público (`opendap.puertos.es`) tiene el **mareógrafo de Arrecife** en tiempo real, pero la serie bruta a 2 Hz está **invertida** respecto a la marea (máximos en las bajamares, comprobado dos días seguidos), mide la distancia del sensor al agua sobre un cero local no documentado y llega con horas de retraso. NIVMAR solo publica el residuo meteorológico, no la marea astronómica.
- **Instituto Hidrográfico de la Marina**: su API (`ideihm.covam.es/api-ihm/getmarea`) devuelve error 500 en todas las variantes y no tiene documentación pública.

Por eso la marea es una **estimación** a partir del nivel del mar del modelo SMOC de Météo-France, y la interfaz lo dice siempre:

- dice «Bajamar *hacia* las 17:30» y no «a las»;
- titula «Pleamares y bajamares (estimadas)»;
- advierte: «Estimación del modelo oceánico… No es una tabla oficial ni sirve para navegar»;
- da las alturas con signo, sobre el nivel medio del mar (−0,9 m / +0,5 m).

Validación del 22-10-2026 en Arrecife: el modelo adelanta 24–37 min respecto a una predicción armónica independiente (tide-forecast.com: bajamar 05:29, pleamar 11:39 y bajamar 17:57, hora canaria). Un test lo comprueba con una tolerancia de 45 min. Open-Meteo advierte de que la precisión en la costa es limitada.

### AEMET: qué funciona y qué falta

- **Avisos**: funcionan sin clave. El API propio lee el RSS oficial de Canarias (`CAP_AFAC65_RSS.xml`, ~7 KB) y el paquete «estado completo» que enlaza (`.tar.gz`, ~8 KB, un CAP 1.2 por aviso). Se queda con los niveles amarillo, naranja y rojo de las zonas 659101 y 659101C que no hayan caducado, en español y sin cancelaciones. El navegador no puede leer esos ficheros (AEMET no envía CORS).
- **Observaciones**: funcionan con clave, verificadas contra el API real el 22-10-2026. El API pide una a una las **7 estaciones de AEMET en Lanzarote** (OpenData solo acepta una estación por petición): C018J Tías-Las Vegas (376 m), C019V Yaiza-Playa Blanca (6 m), C029O Aeropuerto (14 m), C029R Arrecife-Granja Cabildo (108 m), C038N Haría (277 m), C048W Tinajo (275 m) y C839X La Graciosa (19 m). Cada estación ocupa ~5 KB y se procesa en ~0,3 ms; el listado nacional (`todas`) son 3,4 MB y ~270 ms, por eso no se usa. Las horas llegan en UTC (`+0000`) y el viento en m/s, que se pasa a km/h.
- **Qué estación representa a cada zona**: solo una estación baja (≤ 150 m), a 10 km como máximo y con lectura de las últimas 3 h. Las estaciones de interior no describen la costa; Haría, por ejemplo, está detrás del Risco de Famara. Por eso Famara y El Golfo no muestran «Medido»: mejor nada que una lectura de otro sitio. Puerto del Carmen usa el Aeropuerto; Arrecife y Costa Teguise, Granja Cabildo; Playa Blanca, Playa Blanca; Órzola, La Graciosa.
- **Clave**: gratuita en <https://opendata.aemet.es/centrodedescargas/altaUsuario>. En local va en `server/.dev.vars`, una sola línea `AEMET_API_KEY=…`. Git ignora ese archivo y lo leen tanto `npm run api` como `wrangler dev`. En producción se guarda como secreto del servidor, nunca en el frontend. `http://localhost:8787/api/salud` dice si hay clave sin revelarla.

## Caché y actualización

> Consumo real por visitante, límites de los proveedores, capacidad estimada y recomendación a largo plazo: [`API_USAGE_AUDIT.md`](API_USAGE_AUDIT.md).

- **Una petición por fuente para toda la isla.** Open-Meteo admite listas de coordenadas: las 7 zonas cuestan 3 peticiones (tiempo, mar con 7 puntos distintos y polvo), por muchas pantallas que las usen. Las peticiones simultáneas se comparten (`ResponseCache`).
- **Caducidad según el modelo**: tiempo 30 min, mar 60 min, polvo 3 h, avisos 10 min, observaciones 20 min. Las respuestas de Open-Meteo se guardan en `localStorage`, así que recargar dentro de ese plazo no pide nada.
- **Actualización automática**: los stores se revisan cada 15 min (`ClockStore.quarterKey`) y la caché decide si eso llega a la red. «Actualizar» vuelve a pedir lo que tenga más de 1 min.
- **API propio**: guarda cada respuesta en memoria (10–20 min). Si AEMET falla, sirve la copia anterior de hasta 2 h marcada con `stale: true`. Solo atiende rutas fijas (`/api/avisos`, `/api/observaciones`, `/api/salud`): no es un proxy abierto.
- **Hora**: todas las peticiones usan `timezone=Atlantic/Canary` y `timeformat=unixtime` (instantes UTC sin ambigüedad). Los días se agrupan en hora canaria, y el cambio de hora del 25-10-2026 está cubierto por tests.
- **Unidades**: °C, km/h enteros, m y s; las fracciones van de 0 a 1 y el UV en enteros. Las observaciones de AEMET pasan de m/s a km/h.

## Errores y datos ausentes

- Una hora con un valor esencial vacío se descarta; nunca se rellena. La temperatura del agua puede faltar y entonces no se muestra. Si queda menos de un día de previsión, se avisa del error.
- Si falla el tiempo, se muestra «No sabemos qué tal está hoy» con el motivo y «Reintentar». Si falla el mar, el tiempo sigue visible y el mar y la marea dicen «sin datos ahora». Si falla el polvo, simplemente no se detecta la calima.
- Al fallar una actualización se mantienen los últimos datos, con aviso. Nunca se sustituyen por datos simulados: la build de producción no los contiene.
- Sin datos del mar no se invita a la playa. Con un aviso costero de AEMET no se sugieren planes de mar, y la sugerencia de playa lo advierte. Las sugerencias se presentan como orientativas, no como garantías de seguridad.

## Pantallas

- **Hoy**: escena atmosférica generada a partir de los datos (cielo según hora y nubosidad, calima, lluvia, sol o luna, horizonte de cada zona, olas según el mar y nivel del agua según la marea), veredicto, máxima y mínima, viento, mar y marea, 24 h, dónde ir, amanecer y atardecer con el recorrido del sol, detalles (con la medida de AEMET si existe), 7 días y avisos oficiales. En escritorio la escena es una banda panorámica y el detalle va en dos columnas.
- **Zonas**: mapa ilustrado con el estado y el viento por zona, y tarjetas con miniescena.
- **Mar**: marea estimada, curva del día, pleamares y bajamares de hoy y mañana, oleaje, mar de fondo, agua, avisos costeros y zonas más tranquilas.
- **Dónde ir**: recomendaciones derivadas de los datos (playa, sin viento, mar tranquilo, atardecer, paseo, olas).

## El veredicto

La frase grande de Hoy («Hoy apetece playa», «Amanece despejado», «Noche estrellada») sale de `core/insights/verdict.insight.ts`, y su momento del día, de `day-period.ts`.

- **El momento lo marca el sol de la zona**, no una hora fija: se usan el amanecer y el atardecer de Open-Meteo para ese día y ese lugar, en hora canaria. Hay siete momentos:
  - *madrugada*: de 01:00 a una hora antes de amanecer;
  - *primera hora*: de una hora antes a 75 min después de amanecer;
  - *mañana*;
  - *mediodía*: alrededor del punto más alto del sol, de 1 h antes a 90 min después;
  - *tarde*;
  - *atardecer*: la última hora de sol y el crepúsculo, hasta 45 min después;
  - *noche*: hasta la 01:00.

  Así, a las 07:30 de octubre, con el sol aún bajo el horizonte, ya no se dice «Noche templada» sino «Amanece despejado», con la frase «Amanece a las 08:01».
- **Primero los riesgos**, dichos para el momento: lluvia («Amanece lloviendo», «Noche de lluvia»), viento fuerte, calima, viento que va a más y olas en costas de surf. Los consejos de playa solo se dan en las horas en que tiene sentido planearla.
- **Después, lo que ofrece el momento**:
  - de noche, la temperatura y el cielo («Noche cálida», «Noche estrellada», «Noche nublada»);
  - a primera hora, cómo empieza el día y a qué hora sale el sol;
  - de día, la playa, el calor, el sol fuerte a mediodía, el gris según la temperatura o los ratos de sol;
  - al atardecer, cómo se pone el sol y a qué hora.
- **Sin contradicciones**: el titular y la frase leen el mismo cielo, viento y luz. Un test recorre 38 880 combinaciones (cada 20 min del día × cielo × temperatura × viento × mar) y comprueba que nunca se habla de noche con sol, de playa sin datos del mar, de cielo despejado con nubes ni de «templado» a 30 °C.
- Se aplica a «ahora» y a la hora elegida en las 24 horas. En Zonas, a cada zona en este momento.
- Si faltan las horas de sol, el momento se calcula con un día nominal (07:30–19:30), solo para elegir las palabras.

## Idiomas

Español (por defecto) e inglés británico, cambiables al instante en **Ajustes → Idioma**, sin recargar.

- **Solución propia y ligera** en `core/i18n`. Se descartó `$localize` (una build por idioma, sin cambio en tiempo de ejecución) y Transloco (claves sin comprobar en compilación sin herramientas extra, JSON cargado por HTTP y una dependencia más). Los diccionarios son TypeScript: `messages/es.ts` es la fuente y define las claves; `messages/en.ts` está tipado contra él, así que una clave que falte o sobre no compila. Un test comprueba además que cada traducción usa los mismos marcadores.
- **Las reglas no escriben frases.** `core/insights` devuelve descriptores (`{ key, params }`) con valores crudos: números, horas, duraciones, días. `translate()` los formatea por idioma (`es-ES` / `en-GB`, siempre en hora de la isla). La lógica meteorológica es una sola para los dos idiomas.
- **Reactivo con Signals.** `I18n.lang` es un signal; el pipe `t` y los `computed` que traducen lo leen, así que cambiar de idioma vuelve a pintar solo lo que muestra texto. `I18nTitleStrategy` traduce el título de cada ruta; `<html lang>` y la meta descripción siguen al idioma.
- **Elección**: la del visitante se guarda en este dispositivo y manda siempre; si no ha elegido, se toma el primer idioma del navegador que la web habla; si ninguno, español.
- Marcadores: `{nombre}` inserta un valor y `{^nombre}` lo inserta con mayúscula inicial (en español el día de la semana va en minúscula dentro de una frase).
- **Avisos de AEMET**: el API expone el código Meteoalerta del fenómeno (`phenomenonCode`) y la descripción en inglés que publica la propia AEMET en el bloque `en-GB` del CAP (`descriptionEn`). La web nombra el fenómeno por su código en cada idioma; si AEMET no publica inglés, la descripción se muestra tal cual, en español y marcada con `lang="es"`.
- Las etiquetas de la demo viajan en los diccionarios (≈ 2 KB de texto); su código y sus datos siguen fuera de la build de producción.

## Interacción

- **Scroll horizontal** (horas, favoritas, selector de zonas):
  - Con ratón, botones anterior/siguiente que solo aparecen con puntero fino y se desactivan en los extremos.
  - Arrastre: un clic, o un movimiento de menos de 5 px, sigue siendo un clic. Un arrastre nunca elige la hora que queda debajo ni selecciona texto. Al soltar, la tira sigue con la velocidad de la mano y se frena suavemente donde esa velocidad la lleve. Todas las tiras usan la misma directiva y no se ajustan a ninguna rejilla; las horas tenían ajuste y se notaban robóticas. Con movimiento reducido se detiene en seco.
  - Bordes fundidos mientras queda contenido.
  - La rueda horizontal, el trackpad y Mayús + rueda funcionan de forma nativa. La rueda vertical no se secuestra a propósito, para no atrapar el scroll de la página. En el móvil, el desplazamiento táctil es el nativo.
  - En las horas, las flechas, Inicio y Fin las recorren, sin animación. Cada hora mide 60 px en móvil y 72 px en escritorio, con iconos de 32 y 38 px. Todas llevan un borde fino del verde de la selección, y la elegida, además, el verde pleno.
- **Lluvia en la escena**:
  - Trazos sueltos (`RAIN_DROPS`), no un fondo repetido. Su reparto es irregular pero cubre todo el cielo, y hay tres planos de profundidad: los lejanos son más finos, cortos, tenues y lentos.
  - Todos caen con la misma inclinación, y cada uno empieza en un punto distinto de su caída.
  - Cuántos trazos se dibujan depende de la intensidad del código meteorológico, que ya se descargaba: de 36 con llovizna a 120 con chaparrón o tormenta. En escenas estrechas se oculta un tercio.
  - Solo se anima `transform`. La animación se pausa fuera de pantalla y en pestañas ocultas, y con movimiento reducido la lluvia queda quieta.
- **Sin saltos**:
  - Abrir el selector de zonas o cualquier hoja ya no ensancha la página: `scrollbar-gutter: stable` reserva el carril de la barra de desplazamiento.
  - «Volver a ahora» está siempre en el layout; solo aparece y desaparece con un fundido.
  - En la escena, las favoritas y la hora previsualizada comparten una fila de altura fija, que existe aunque no haya favoritas.
  - Medido en Chrome a 390, 820 y 1440 px, en español e inglés: 0 px de desplazamiento.
- **Identificadores** para las herramientas del navegador: IDs en inglés para lo único (`weather-hero`, `current-temperature`, `hourly-forecast`, `tide-visualization`, `language-selector`…), clases semánticas para lo repetido y `data-*` para cada instancia (`data-location-id`, `data-index`…). Convención completa en [`docs/DESIGN.md`](docs/DESIGN.md#identificadores).
- **Iconos**: Lucide para la interfaz, importado icono a icono, y los propios donde dan identidad. Criterios en [`docs/DESIGN.md`](docs/DESIGN.md#iconos).

## Arquitectura

```
src/app/
  core/models        contratos tipados (ubicación, tiempo, mar, mareas, avisos, observaciones)
  core/data          puertos de datos + catálogo de zonas (locations.ts)
  core/data/http     adaptadores reales: Open-Meteo (cliente, DTO, mapeadores), AEMET vía API propio,
                     caché de respuestas, errores; fixtures con respuestas reales para los tests
  core/i18n          idiomas: diccionarios tipados (es fuente, en), traducción y formato por idioma,
                     signal del idioma, pipe t y títulos de ruta
  core/insights      reglas puras: datos → descriptores de texto ({ key, params }) y recomendaciones
  core/state         stores con Signals y rxResource (Forecast, Island, Official, Locations…)
  data-providers.ts  proveedores reales; la build "demo" lo sustituye por data-providers.demo.ts
  mocks/             simulador + fuentes simuladas + controles de demo (solo build demo y tests)
  shared/            escena, iconos, hoja, aviso oficial, crédito de datos, recomendación,
                     arco del sol, scroll horizontal
  layout/            navegación, selector de zonas, selector de idioma, ajustes
  features/          today · zones · sea · plans (rutas con carga diferida)
server/              API propio (Fetch estándar): avisos y observaciones de AEMET, con tests
scripts/             verify-sources.ts: comprobación en vivo de todas las fuentes
```

## Despliegue

- **Web**: estática (`npm run build` → `dist/que-tal-hoy/browser`), en cualquier hosting.
- **API**: `server/api.ts` exporta un manejador `fetch` estándar. Sirve tal cual como Cloudflare Worker (`export default`), en Deno, o en cualquier host Node con `node server/dev.ts` (puerto en `PORT`). Variables: `AEMET_API_KEY` (secreto) y `ALLOWED_ORIGIN` (por defecto `*`).
- La web llama a `/api` en su mismo origen. Si el API vive en otro dominio, cambia `provideHttpDataSources({ proxyUrl: 'https://…/api' })` en `src/app/data-providers.ts`.
- Cabe en el plan gratuito de Cloudflare Workers (10 ms de CPU por petición). Avisos: dos ficheros de ~8 KB. Observaciones: 7 estaciones de ~5 KB, unos 0,3 ms cada una. Cada actualización hace como mucho 15 subpeticiones a AEMET, por debajo del límite de 50.

## Diseño

Sistema documentado en [`docs/DESIGN.md`](docs/DESIGN.md). Tokens en `src/styles/_tokens.scss`, con la paleta de la isla en OKLCH y tema nocturno propio, y tipografía Bricolage Grotesque variable. Todo el movimiento respeta `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast`. La fase 2 solo añade el aviso oficial, el crédito de datos y la lista de fuentes en Ajustes, con los mismos tokens.

## Limitaciones conocidas

- Marea solo estimada (ver arriba); no sirve para navegar ni para actividades que dependan de la hora exacta.
- El oleaje es de mar abierto, a 3–18 km de cada zona, y no describe la rompiente en la orilla.
- La resolución del modelo del tiempo hace que algunas zonas compartan valores (Arrecife y Costa Teguise).
- Los valores de «Ahora» son previsión del modelo para este momento, no medidas. La medida de AEMET («Medido») solo aparece donde hay una estación costera cerca, así que no en Famara ni El Golfo.
- La calima se detecta con un umbral orientativo de polvo en superficie (100 µg/m³, CAMS a 45 km de resolución).
- Revisión visual hecha en Chrome headless (360–1920 px); falta probar en dispositivos reales.
- Las horas de amanecer y atardecer son las de Open-Meteo para cada zona. Si faltan, se dice y la escena se dibuja con un día nominal (7:30–19:30), solo como ilustración.
- La descripción de un aviso solo sale en inglés si AEMET la publica así; parte de su texto libre puede venir en español.
