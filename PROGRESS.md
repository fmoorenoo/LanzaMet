# Progreso

## Fase 1 — Prototipo con datos simulados

Interfaz completa (Hoy, Zonas, Mar, Dónde ir), escena atmosférica, sistema de diseño y arquitectura por puertos de datos con un simulador determinista. Punto de recuperación: tag `fase-1-prototipo`.

## Fase 2 — Datos reales (22-10-2026, rama `fase-2/apis-reales`)

### Estado de las fuentes

| Fuente | Estado | Notas |
|---|---|---|
| Open-Meteo Forecast (DWD ICON) | ✅ Integrada y verificada | 9 zonas en una sola petición; 48 h y 7 días |
| Open-Meteo Marine (Météo-France) | ✅ Integrada y verificada | Oleaje, mar de fondo y agua en 7 puntos de mar abierto elegidos a mano |
| Marea | ⚠️ Solo estimación | Nivel del mar del modelo SMOC; en la interfaz siempre como estimación no oficial |
| Open-Meteo Air Quality (CAMS) | ✅ Integrada | Polvo → calima (umbral orientativo de 100 µg/m³) |
| AEMET avisos (RSS + CAP) | ✅ Integrada y verificada en vivo | A través del API propio; no necesita clave |
| AEMET OpenData observaciones | ✅ Integrada y verificada en vivo | 7 estaciones de Lanzarote, pedidas una a una; clave solo en el servidor (`server/.dev.vars` en local) |
| Puertos del Estado | ⛔ No integrable | Sin API pública de predicción; condiciones de descarga que prohíben ceder datos; mareógrafo de Arrecife invertido y sin cero documentado |
| IHM (mareas) | ⛔ No disponible | El API responde 500 y no está documentado |

### Hecho

1. **Revisión y punto de recuperación**: tag `fase-1-prototipo` y rama de trabajo.
2. **Contratos**: oleaje con mar de fondo y dirección, temperatura del agua opcional, punto de mar abierto por zona, procedencia de la marea (`official`) y datum, avisos y observaciones oficiales.
3. **Open-Meteo**: cliente con una petición por fuente para toda la isla, mapeadores puros (sin rellenar huecos), `timezone=Atlantic/Canary` + `timeformat=unixtime`, cielo a partir del código WMO, la nubosidad y el polvo, y el día nombrado por la condición que dura un tercio de las horas de luz.
4. **Mar**: puntos de consulta elegidos sobre la malla de 1/12° (el modelo enmascara la costa y desplazaba Famara al norte de La Graciosa). Mar de fondo en palabras, distancia al punto de mar abierto y aviso de que en la orilla puede ser distinto.
5. **Mareas**: extremos detectados con interpolación parabólica sobre la serie horaria. Se presentan como estimación («hacia las», «(estimadas)», alturas con signo sobre el nivel medio) y la gráfica admite alturas negativas.
6. **AEMET**: API propio (`server/`) con avisos oficiales para Lanzarote (zonas 659101 y 659101C) y observaciones preparadas. Rutas fijas, caché en memoria, copia anterior si AEMET falla, CORS configurable. En la web: banner de avisos (Hoy; avisos costeros en Mar), «Medido» con estación y hora, y estado de cada fuente en Ajustes.
7. **Recomendaciones**: sin planes de mar con aviso costero, la playa advierte del aviso, sin invitar a la playa si el mar es desconocido, y textos orientativos («según la previsión») en vez de garantías.
8. **Caché y actualización**: `ResponseCache` (memoria + `localStorage`, peticiones compartidas, caducidad según el modelo, «Actualizar» revalida a partir de 1 min) y revisión cada 15 min.
9. **Separación de mocks**: build `demo` mediante `fileReplacements`; los controles de demo se inyectan en Ajustes por token. Comprobado que la build de producción no contiene código simulado.
10. **Atribución**: pie con fuente, licencia CC BY 4.0 y hora de consulta en las cuatro páginas; lista completa de fuentes en Ajustes.

### Validación (22-10-2026)

- **Endpoints reales** (`npm run verify:sources`): las 9 zonas devuelven zona horaria correcta, 48 h sin huecos, 7 días y amanecer en hora canaria. Los 7 puntos de mar son celdas de mar propias con olas, agua y nivel del mar plausibles, y AEMET devuelve 20 CAP de Canarias (0 avisos amarillos o superiores para Lanzarote ese día; todos verdes).
- **Datos por zona** (16:10 hora canaria): Famara y La Santa con olas de 1,4 m del NNO y mar de fondo de 11 s; El Golfo 1,3 m; Órzola 1,2 m; Playa Blanca y Papagayo 0,9 m; Costa Teguise 0,7 m; Arrecife y Puerto del Carmen 0,4 m. Brisa del noroeste en Famara (12 km/h) y casi calma en el sur y el este.
- **Marea**: el modelo adelanta 24–37 min respecto a una predicción armónica independiente para Arrecife (test con tolerancia de 45 min).
- **Tests**: 58 de la web (incluye mapeadores sobre respuestas reales capturadas, cambio de hora del 25-10, una sola petición para 9 zonas, caché y «Actualizar», errores, API ausente o sin clave) y 15 del API (ficheros reales de AEMET, rutas, CORS, caché, falta de clave y fallo de AEMET).
- **Lint, tipos del API, formato y build de producción**: sin errores ni avisos (sin superar el presupuesto de estilos).
- **Revisión visual** en Chrome headless a 390 px y 1440 px de las cuatro páginas (Hoy en Arrecife, Famara, Playa Blanca y El Golfo; Mar en Famara, El Golfo y Playa Blanca), sin excepciones de JavaScript.
- **Errores provocados** bloqueando la red: sin Open-Meteo (error claro con «Reintentar»), sin el API marino (el tiempo sigue visible y el mar dice «sin datos ahora»), sin polvo (sin calima) y sin el API propio (sin avisos, sin fallos).

### Corregido durante la validación

- «Sin viento del sur»: sin viento ya no se nombra dirección.
- Con el mar desconocido, Famara pasaba a «Hoy apetece playa»: ahora no se invita a la playa sin datos del mar, y el veredicto espera atenuado a que llegue el mar.
- El presupuesto de estilos de Mar se superaba en 20 bytes: el pie se comparte ahora como estilo global (`.page-foot`).

### Observaciones de AEMET (con clave, 22-10-2026)

- Clave en `server/.dev.vars`, que Git ignora; nunca pasa por el frontend ni por la conversación.
- Verificado contra el API real: el formato coincide con el previsto (`fint` en UTC con `+0000`, viento en m/s, ISO-8859-15). Las 7 estaciones de Lanzarote responden con la lectura de la última hora.
- El listado nacional (`todas`, 3,4 MB, ~270 ms de CPU) no cabía en el plan gratuito de Cloudflare. Se pasó a pedir estación por estación (~5 KB y ~0,3 ms cada una), de tres en tres; si una estación falla, las demás siguen.
- Una estación solo representa a una zona costera si está a ≤ 150 m de altura, a ≤ 10 km y con lectura de las últimas 3 h. Haría, Tinajo y Tías quedan fuera por estar en el interior: Haría, a 7 km de Famara, medía viento del sureste mientras en la playa soplaba del noroeste. Famara, La Santa y El Golfo no muestran medida.
- Tests: 62 de la web (+4 de la regla de estaciones con posiciones y altitudes reales) y 17 del API (+2 con una respuesta real de la estación del Aeropuerto).

### Pendiente

1. **Desplegar en Cloudflare**: la web y el API propio en un mismo Worker, con la clave de AEMET como secreto (`wrangler secret put AEMET_API_KEY`).
2. Revisar cada cierto tiempo la lista de estaciones de AEMET en Lanzarote (`LANZAROTE_STATIONS`).
3. **Fuente oficial de mareas**: pedir a Puertos del Estado o al IHM acceso autorizado a sus predicciones para Arrecife; sustituiría la estimación sin cambiar la interfaz (`TideSource.official`).
4. Probar en dispositivos reales (iOS y Android).
5. Valorar acotar la ventana de playa al atardecer (hoy puede terminar hasta una hora después de la puesta de sol, por la resolución horaria).

## Fase 3 — Interfaz, UX e idiomas (22-10-2026, rama `fase-3/interfaz-i18n`)

Punto de recuperación: tag `fase-2-datos-reales`. Skills de diseño usadas: Impeccable (refinamiento sobre el sistema existente, playbook de layout y detector) y Emil Kowalski (interacciones y movimiento).

### Hecho

1. **Zonas unificadas**: fuera Papagayo y La Santa, que repetían las celdas del modelo de Playa Blanca y Famara. Quien las tuviera guardadas como zona o favorita pasa a esas dos (`RETIRED_LOCATIONS`). 7 zonas, 7 puntos de mar distintos.
2. **IDs y clases** en inglés para las herramientas del navegador, con `data-*` por instancia; la escena expone lo que dibuja. Sin IDs duplicados en ninguna página.
3. **Amanecer y atardecer** reales de Open-Meteo, por fecha de la isla y por zona, con un arco que muestra el tramo recorrido y cuánto queda. El contrato acepta horas de sol ausentes: un día sin ellas ya no se descarta ni hace fallar la previsión.
4. **Scroll horizontal** cómodo con ratón y teclado (directiva `HorizontalScroll` + `ScrollControls`), sin secuestrar la rueda vertical.
5. **Iconos**: Lucide 1.52.0 para la interfaz, propios para la identidad, tamaños por rol.
6. **Bilingüe** español / inglés en tiempo de ejecución, con reglas que devuelven descriptores y formato por idioma. El API de AEMET añade `phenomenonCode` y `descriptionEn`.
7. **Hoy en escritorio**: banda panorámica y detalle en dos columnas.

### Corregido por el camino

- De noche se leía «el sol calienta más de lo que parece» y «Sol intenso el resto del día»: ahora «se nota más templado de lo que marca» y «Ya sin sol hasta mañana».
- Accesibilidad (WCAG 2.5.3): las celdas de las horas y los marcadores del mapa tenían un nombre accesible distinto del texto visible; ahora lo contienen. En mapas pequeños el nombre de la zona se ocultaba también a los lectores de pantalla.
- Los avisos dejan el borde lateral grueso por un tinte del nivel, mezclado en OKLab (en OKLCH el ámbar viraba a verde).
- Las etiquetas de pleamar y bajamar junto a los bordes de la gráfica se salían de ella.
- «Toca una hora para verla arriba» pasa a «Elige una hora para verla en la escena» (vale para ratón y para la escena a la izquierda o arriba).

### Validación

- **Tests**: 77 de la web (antes 62; nuevos: migración de favoritas, luz del día, día sin horas de sol, diccionarios con los mismos marcadores, formato por idioma, detección y persistencia del idioma) y 17 del API (con el código del fenómeno y la descripción en inglés reales de un CAP de AEMET).
- **Lint, formato, tipos del API y build de producción** sin errores ni avisos de presupuesto (inicial 419,6 kB, 114,3 kB transferidos). Sin código ni datos simulados en producción.
- **Accesibilidad**: axe-core 4.14 sin violaciones en Hoy, Zonas, Mar y Dónde ir, con el selector de zonas y Ajustes abiertos, en español e inglés, tema claro y oscuro, móvil y escritorio. El contraste del texto sobre la escena no lo mide axe (fondos degradados); se mantiene el sombreado validado en la fase 1.
- **Revisión visual** en Chrome headless a 390, 820, 1024, 1280, 1440 y 1920 px, de día y de noche, en los dos idiomas, y en la build de demo (escenario borrasca, con avisos). Probados con eventos reales de ratón los botones y el arrastre de las horas.
- **Impeccable detect** sin hallazgos en los ficheros de interfaz cambiados.

### Pendiente

1. Reiniciar el API propio allí donde esté desplegado para que sirva `phenomenonCode` y `descriptionEn` (la web funciona igual sin ellos).
2. Probar en dispositivos reales, incluido el arrastre y los botones de las tiras en tabletas con ratón.
3. `npm audit` señala vulnerabilidades en `vite` dentro de `@angular/build` (solo herramientas de desarrollo); se resuelven al actualizar Angular CLI.

## Fase 4 — Veredicto, selector horario y consumo de APIs (23-10-2026)

Skills usadas: Emil Kowalski (arrastre, inercia, transiciones) e Impeccable (auditoría de jerarquía, accesibilidad, adaptación y textos).

### Hecho

1. **Veredicto según el momento del día** (`day-period.ts`). Siete momentos marcados por el amanecer y el atardecer reales de cada zona, en hora canaria: madrugada, primera hora, mañana, mediodía, tarde, atardecer y noche. A las 07:30 de octubre (amanecer a las 08:01) ya no dice «Noche templada», sino «Amanece despejado. Amanece a las 08:01».
2. **Catálogo de frases** ampliado con mesura, en español y en inglés:
   - riesgos dichos para el momento: lluvia, viento y calima de noche, al amanecer y de día;
   - noche y madrugada por temperatura y por cielo;
   - amanecer y atardecer con su hora;
   - calor, sol de mediodía, gris según la temperatura y ratos de sol;
   - playa por la tarde.
   El veredicto usa la hora elegida en la previsión, y en Zonas, el momento actual.
3. **Selector de horas**:
   - Cada hora mide 72 px en escritorio y 60 px en móvil (antes 56), con iconos de 38 y 32 px (antes 26) y temperaturas algo mayores en escritorio.
   - El resaltado va hundido, para separar las horas vecinas.
   - La curva y sus puntos se calculan en CSS a partir de las filas de cada hora.
4. **Arrastre con ratón**:
   - Al soltar, la tira proyecta la velocidad de la mano y se detiene en la hora más cercana. Ya no salta al volver el `scroll-snap`.
   - Una pausa antes de soltar anula la inercia.
   - El arrastre limpia cualquier selección de texto y no encoge la hora pulsada.
   - Los botones, la rueda, las teclas y cualquier toque detienen el deslizamiento.
   - Las teclas se mueven sin animación.
   - Con movimiento reducido no hay inercia.
5. **Sin saltos de layout**:
   - **Selector de zonas.** Causa: `html:has(dialog[open]) { overflow: hidden }` quitaba la barra de desplazamiento, y a 1440 px los elementos alineados a la derecha se movían 10 px. Solución: `scrollbar-gutter: stable`.
   - **«Volver a ahora».** Causa: el botón (2,75 rem) era más alto que la cabecera (2,5 rem), y se añadía y quitaba del DOM, así que las horas bajaban 4 px. Ahora vive en el componente de horas, siempre en el layout, y solo cambia de opacidad y visibilidad; con `inert` mientras está oculto. Al pulsarlo, el foco va a «Ahora».
   - **Escena.** La fila de la hora previsualizada medía 44 px y la de las favoritas 46 px, y sin favoritas aparecía de la nada. Ahora ambas comparten una ranura de altura fija. Al volver a ahora, el foco va al botón de la zona.
6. **Auditoría de consumo de APIs**, solo análisis, en [`API_USAGE_AUDIT.md`](API_USAGE_AUDIT.md). No se ha cambiado el sistema de consumo.

### Validación

- **Tests**: 102 de la web (antes 77) y 17 del API. Nuevos:
  - momentos del día alrededor de las 07:30, del amanecer, del mediodía y del atardecer, a medianoche y en el cambio de hora del 25-10-2026, en octubre, diciembre y junio;
  - frases por momento en los dos idiomas;
  - un barrido de 38 880 combinaciones contra contradicciones. Encontró una real, «Amanece templado» a 24 °C, ya corregida con «Amanece cálido».
- **Lint, formato y builds** de producción y de demo sin errores ni avisos de presupuesto. Inicial: 425,6 kB, 115,7 kB transferidos.
- **Estabilidad** medida en Chrome sin interfaz a 390, 820 y 1440 px, en español e inglés y sin favoritas: 0 px de desplazamiento al previsualizar una hora, al volver a ahora y al abrir o cerrar el selector de zonas.
- **Arrastre** probado con eventos reales de ratón:
  - un arrastre lento avanza 2 horas exactas sin elegir ninguna;
  - un lanzamiento llega al final;
  - un clic y un temblor de 3 px eligen hora;
  - Inicio y Fin funcionan;
  - con movimiento reducido no hay inercia;
  - nunca se selecciona texto.
- **Revisión visual** de día y de noche a 360, 390 y 1440 px, en los dos idiomas: foco visible en las horas y sin desbordamiento horizontal.

### Pendiente

1. **Decidir sobre la auditoría de APIs.** La recomendación es una caché compartida con actualización programada en el API propio (Cloudflare Worker + Cron + KV). Hasta revisarla no se toca el consumo.
2. Probar el arrastre y la inercia en dispositivos reales con ratón y trackpad.

## Fase 5 — Refinamiento visual e interacciones (23-10-2026)

Skills usadas: Emil Kowalski (arrastre, lluvia, transiciones) e Impeccable (coherencia de tokens y alineación).

### Hecho

1. **Bordes en las horas**: todas las horas llevan 1 px de `--c-accent-soft`, el tono del relleno de la elegida. La elegida conserva el relleno y pasa al verde pleno (`--c-accent`). Comprobado en los temas claro y oscuro.
2. **Lluvia natural**:
   - Antes era un fondo de 40×60 px con dos trazos idénticos, desplazado en bloque. Ahora son de 36 a 120 trazos sueltos.
   - Se generan con una semilla fija (siempre la misma lluvia) y se reparten con la proporción áurea más un desplazamiento aleatorio.
   - Hay tres profundidades, y cada trazo varía en grosor, longitud, opacidad y velocidad, y empieza en un punto distinto de su caída. Todos conservan la inclinación anterior.
   - La densidad sigue a la intensidad del código WMO que ya se descargaba (`rainIntensityFor`): no se pide nada nuevo a Open-Meteo.
   - Solo se anima `transform`, con unidades de contenedor para que la caída encaje en cualquier tamaño.
   - Los trazos se pausan fuera de pantalla y en segundo plano, quedan quietos con movimiento reducido y aparecen y se van con un fundido.
3. **Presupuestos de estilos**: medidos todos los componentes. Escena 4,16 kB, Mar 4,00, horas 3,96 y navegación 3,94; el resto, 3,5 kB o menos. El aviso por componente pasa de 4 a 6 kB y el error de 8 a 10 kB: margen razonable para los más complejos, sin esconder un componente que se dispare. El presupuesto inicial no cambia (426 kB de 500 kB). Se recupera la pequeña subida de «Volver a ahora» que se había quitado por el límite.
4. **Altura de las favoritas**: el token `--sky-control-h` (2,5 rem) es ahora la altura de todos los controles sobre la escena. Las favoritas medían 34 px y la zona 40; ahora todos miden 40 px. Además se corrigió un desfase de 2 px en escritorio: el botón de zona quedaba arriba de la fila y ahora se centra como los demás.
5. **Arrastre de las horas igual que el de las favoritas**:
   - Las dos tiras ya compartían la directiva `HorizontalScroll`. La diferencia era el `scroll-snap` de las horas: tiraba de cada deslizamiento hacia la hora exacta, y eso se notaba robótico.
   - Se quita el ajuste de las horas y, con él, la búsqueda de puntos de ajuste de la directiva, que ya no usaba nadie.
   - Mismo gesto de ratón: las dos tiras se frenan con la misma curva, en unos 170 ms.
   - Táctil nativo, teclado y botones sin cambios.

### Validación

- **Tests**: 106 de la web (nuevos: intensidad de lluvia por código, número de trazos por intensidad, reparto que cubre todo el cielo sin rejilla y trazos que nunca van al paso) y 17 del API.
- **Lint, formato y builds** de producción y de demo sin errores ni avisos. Inicial: 426,1 kB, 116,0 kB transferidos.
- **En Chrome sin interfaz**:
  - Lluvia del escenario «borrasca» a 1440 y 390 px: tiempos de fotograma de unos 4 ms, pausa fuera de pantalla y quietud con movimiento reducido.
  - Alturas y alineación de los controles a 360, 820 y 1440 px, en español e inglés.
  - Bordes de las horas en los temas claro y oscuro.
  - Arrastre comparado con el mismo gesto en las dos tiras.
  - 0 px de desplazamiento del layout al previsualizar horas, volver a ahora y abrir el selector de zonas.

### Pendiente

1. Probar la lluvia y el arrastre en dispositivos reales, sobre todo en móviles modestos.
