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

## Fase 6 — Hora actual, accesibilidad y paisaje propio de cada zona (23-10-2026)

### Hecho

1. **Hora en la escena de Hoy**:
   - Junto a la temperatura, tras un filete: «Ahora 14:36». Dice a qué momento corresponde la cifra, sin ser un reloj aparte.
   - Hora canaria y reloj de 24 h en los dos idiomas, como el resto de la web (`en-GB`).
   - Si el reloj de quien visita marca otra hora, la etiqueta pasa a «En Lanzarote» / «In Lanzarote». Si no, los lectores de pantalla oyen además «hora de Canarias».
   - Queda fuera de la región `aria-live` (`aria-live="off"`) para que no se anuncie cada minuto.
   - Mientras se previsualiza otra hora se aparta: la franja de la hora previsualizada ya dice qué momento se ve.
   - `ClockStore` cambia justo al cambiar el minuto. Antes iba cada 30 s, con hasta medio minuto de retraso. Además se pone al día al volver a una pestaña que estaba en segundo plano.
2. **Hora en la gráfica de mareas**: se aprovecha la marca de «ahora» que ya había, sin duplicarla.
   - El pasado sigue atenuado.
   - La línea es discontinua sobre el agua y continua desde el punto de la curva hasta el eje, donde se lee «Ahora · 14:36».
   - La etiqueta nunca se sale de la gráfica, y las horas del eje que taparía se apartan. Su anchura se mide en el navegador, así que vale en los dos idiomas y a cualquier ancho.
3. **Botones solo con icono**:
   - Nueva directiva `qthTooltip`. Muestra una etiqueta al pasar el ratón (tras 450 ms, o al instante si ya había otra abierta) y al llegar con el teclado, siempre en el idioma de la web.
   - Cumple WCAG 1.4.13: se cierra con Escape, el puntero puede pasar sobre ella sin que desaparezca y dura mientras dura el hover o el foco. Al pulsar el botón se va.
   - Se dibuja en la capa superior (`popover`), así que ningún contenedor la recorta, tampoco dentro del selector de zonas.
   - Está oculta a los lectores de pantalla, que ya leen el `aria-label` del botón.
   - No se usa `title` a propósito: añadiría una segunda burbuja sin estilo, que tarda en salir y nunca aparece con teclado ni en pantallas táctiles.
   - Llevan tooltip:
     - la estrella y los ajustes de la escena;
     - el botón de la demo, que en móvil se queda solo con el icono;
     - las estrellas de Zonas y del selector;
     - cerrar de las hojas;
     - anterior y siguiente de las tiras.
   - Las estrellas dicen la acción («Añadir Famara a favoritas» / «Quitar…»), mientras su nombre accesible es estable («Favorita: Famara») y el estado lo da `aria-pressed`. La estrella de la escena antes se llamaba solo «Zona favorita»; ahora lleva el nombre del lugar.
4. **Paisaje propio de cada zona** (`shared/scene/scenery.ts`). Se buscaron referencias reales de cada lugar y se interpretaron con las formas planas de la escena, sin copiar fotografías:
   - **Arrecife (El Reducto):** la ciudad baja y blanca del frente marítimo, sus palmeras y el Gran Hotel, la única torre de la isla, con vidrio en cada planta.
   - **Puerto del Carmen:** el paseo de palmeras de la Avenida de las Playas y el pueblo subiendo la ladera, con Lobos y Fuerteventura enfrente.
   - **Playa Blanca:**
     - un horizonte nuevo, `bocaina`: Fuerteventura cerca y alta, y Lobos con su cráter delante;
     - casas bajas;
     - Punta Pechiguera con el faro de 50 m y el viejo al lado;
     - el ferri a Corralejo.
   - **Costa Teguise (Las Cucharas):** bloques ordenados tras el paseo, palmeras intercaladas y escolleras de roca. Las velas de windsurf salen solo de día y según el viento, de ninguna a tres.
   - **Famara:** el Risco (rehecho después; ver «Ajustes tras la revisión»).
   - **Órzola:** casas blancas en la punta, el dique con su luz verde, barcas fondeadas y el barco a La Graciosa.
   - **El Golfo:** el medio cráter con capas ocre, óxido y negro que siguen la forma de la pared, el Charco de los Clicos verde a su pie y Timanfaya detrás.
5. **Cómo está hecho**:
   - `Location.scenery` elige el paisaje de cada zona; `horizon` sigue eligiendo el horizonte natural.
   - Siete primitivas componen los siete paisajes: casas, pueblos sembrados con semilla fija, torre, palmera, faro, escollera y cosas a flote.
   - Cada papel (paredes, sombra, ventanas, vidrio, palmeras…) es un solo `path`. Cada paisaje se calcula una vez y queda en caché.
   - Las tarjetas de Zonas heredan el paisaje sin coste extra.
   - Los colores salen de la luz de la escena: cal templada por el cielo de día, tonos cálidos al atardecer y sombra de noche. De noche quedan algo más claros que la tierra, con las ventanas, el faro y la luz del muelle encendidos.
   - Las barcas cabecean y las velas se inclinan con pequeñas animaciones CSS:
     - se pausan fuera de pantalla y en segundo plano;
     - quedan quietas en las tarjetas y con movimiento reducido.
   - En pantallas estrechas la tierra se ancla a la derecha (`xMaxYMax slice`), donde están los hitos y no hay texto. Lo alto va a la derecha de x = 1000 y lo demás queda bajo, porque en móviles bajos el texto llega al horizonte.

### Validación

- **Tests**: 112 de la web (antes 106) y 17 del API. Nuevos:
  - cada zona con un paisaje distinto;
  - en cada paisaje, lo que identifica a su zona;
  - nada alto donde va el texto y nada a flote por encima del agua;
  - el reloj que cambia con el minuto y se pone al día al volver a la pestaña.
- **Lint, formato y builds** de producción y de demo sin errores ni avisos de presupuesto. Inicial: 430,2 kB, 117,1 kB transferidos.
- **En Chrome sin interfaz, con eventos reales de ratón y teclado**, en español e inglés:
  - el tooltip no sale a los 150 ms y sí a los 750;
  - sigue al pasar el puntero sobre él, y se cierra con Escape y al salir;
  - aparece con Tab y se va con el foco;
  - al pulsar la estrella cambia `aria-pressed` y el nombre se mantiene;
  - funciona dentro del selector abierto;
  - ningún botón queda sin nombre accesible.
- **axe-core 4.10** sin violaciones en Hoy, Zonas, Mar, Dónde ir y con el selector de zonas abierto, en español (1440 px) e inglés (390 px).
- **Revisión visual**:
  - las siete zonas a 1440, 390 y 360 × 640 px, de día, al atardecer (19:06) y de noche (21:30);
  - las tarjetas de Zonas;
  - la hora de la escena y de la marea en los dos idiomas;
  - al previsualizar las 18:00, el reloj se aparta.

### Ajustes tras la revisión

1. **Famara**:
   - Sin casas.
   - El Risco tiene un contorno propio (`profile`: puntos suavizados con algo de roca rota) en vez de un bloque:
     - Peñas del Chache, el punto más alto, queda lo más cerca, a la derecha;
     - la pared baja hacia el norte, con las muescas de sus valles, y cae al mar;
     - su tramo lejano va en el tono del horizonte, más claro por la distancia.
2. **Gran Hotel**:
   - Más esbelto y alto (17 plantas), de vidrio verdeazulado.
   - Líneas claras en cada planta, cantos blancos y un podio bajo.
   - Arriba, el pabellón de vidrio del restaurante bajo una línea de acero.
   - De noche el vidrio queda oscuro, apenas templado, y ya no parece un farol.
3. **Hora actual**:
   - Pasa a la esquina superior derecha, delante de favorita y ajustes, como una píldora con el mismo fondo, borde, altura y radio que esos botones (`.sky-badge` comparte la base de `.sky-chip` y `.sky-button`, sin hover ni pulsación).
   - Ya no se aparta al previsualizar una hora: es la hora actual, no la de la cifra.
   - En móviles estrechos (≤ 26 rem) muestra solo la hora; «Ahora» sigue para los lectores de pantalla. Para que quepa el nombre de la zona, ahí se oculta el icono de ubicación y se ajustan un poco los espacios.
   - «Puerto del Carmen» cabe entero a 390 px; a 360 px pierde unas letras.
4. Validación: 112 tests, lint, formato y build sin avisos; axe sin violaciones en las cuatro páginas y con el selector abierto, en español (1440 px) e inglés (390 px).

### Pendiente

1. Probar en dispositivos reales los paisajes en móviles pequeños y los tooltips en tabletas con ratón.
2. En móviles muy bajos (≈ 640 px) con un veredicto largo, el texto llega al horizonte y puede quedar sobre el cráter de El Golfo. Se lee gracias al halo del texto, pero conviene revisarlo si cambia la composición de la escena.

## Mapa de Zonas con el contorno real (23-10-2026)

### Hecho

1. **Contorno de OpenStreetMap**:
   - El dibujo a mano (44 puntos para Lanzarote y 8 para La Graciosa, suavizados) se sustituye por las relaciones de isla de OSM: Lanzarote (2214686), La Graciosa (3251775) y Montaña Clara (13212914).
   - Se unen sus tramos de costa en anillos y se simplifican con Douglas–Peucker a 120 m, por debajo de un píxel a la escala del mapa, redondeando a 4 decimales.
   - Quedan 290 puntos para Lanzarote, 49 para La Graciosa y 12 para Montaña Clara (`coastline.ts`, 8,7 kB sin comprimir). Con tantos puntos se dibujan segmentos rectos, sin suavizar.
   - Las áreas cuadran con las reales: 810 km² Lanzarote y 27 km² La Graciosa.
   - La Graciosa y Montaña Clara son islas aparte, con el estrecho de El Río visible. Alegranza queda fuera del encuadre: incluirla obligaba a alargar el mapa un 20 %.
2. **Una sola proyección** para costa y marcadores: equirectangular con la longitud corregida por el coseno de 29°, la que ya usaba el mapa. Solo se sube el borde norte (29,315) para que quepa Montaña Clara.
3. **Posiciones comprobadas** con Nominatim y la costa de OSM:
   - Las siete zonas caen dentro de su localidad.
   - **El Golfo** estaba 83 m mar adentro y pasa a la coordenada de OSM para el caserío (28,9822 / −13,8314). El modelo del tiempo sigue leyendo la misma celda, así que la previsión no cambia.
   - Órzola queda a 36 m de la costa y Playa Blanca a 24 m; todas en tierra.
4. **Etiquetas**: la de Órzola pasa de la izquierda a abajo. A la izquierda tapaba justo La Graciosa y el estrecho.
5. **Crédito**:
   - La costa va incluida en la web y no se consulta OpenStreetMap en ningún momento.
   - Aun así, al derivar de sus datos, la licencia ODbL pide citarla. Se hace en Ajustes, en «De dónde salen los datos» («Mapa de la isla: © colaboradores de OpenStreetMap. Licencia ODbL»), no sobre el mapa.

### Validación

- **Tests**: 116 de la web (antes 112). Nuevos:
  - todas las zonas sobre Lanzarote y no en el mar;
  - La Graciosa y Montaña Clara separadas de Lanzarote;
  - costa y marcadores dentro del encuadre;
  - distancias proporcionales en todas direcciones (error menor del 1 %).
- **Comparación con el mapa real**: el contorno simplificado y los siete puntos, superpuestos a teselas de OSM en la misma proyección, coinciden con la costa y con cada localidad.
- **A 360, 390, 820 y 1440 px**:
  - ninguna etiqueta se solapa con otra ni con un punto;
  - ninguna la recorta el panel;
  - el mapa no se deforma: la proporción la fija el `viewBox`.
- Al pulsar los marcadores se selecciona la zona (`aria-pressed`).
- **axe** sin violaciones en Zonas, en español e inglés. Lint, formato y build de producción sin avisos.

## Zonas más vivas y vuelta de La Santa (23-10-2026)

### Hecho

1. **Isla y mar en el mapa de Zonas**:
   - Tierra con color propio en los dos temas: arena volcánica cálida de día y picón de noche. Son tokens nuevos (`--c-land`, `--c-land-islet`, `--c-land-edge`). La Graciosa y Montaña Clara van algo más claras. El contorno no cambia.
   - Mar con textura estática. La costa se dibuja tres veces bajo la tierra, en trazos anchos y muy tenues, y el agua se aclara por franjas hacia la orilla. En mar abierto hay ondas finas, sembradas con semilla fija, que nunca tocan la costa.
2. **Capas**: el viento pasa por encima de la isla y por debajo de los marcadores y sus etiquetas (`pointer-events: none`). Antes iba debajo de la isla.
3. **Viento más natural**. Antes eran diez líneas discontinuas que se desplazaban en bloque a la misma velocidad. Ahora son 14 ráfagas sueltas, cada una con su altura, longitud, curva, opacidad, ritmo (11–17 s), arranque y un leve vaivén. Aparecen, cruzan y se desvanecen, con la cola difuminada.
   - Solo se animan `transform` y `opacity`.
   - Con movimiento reducido, cada ráfaga queda quieta en su propio punto del recorrido.
   - La dirección sigue a la del viento como antes.
4. **La Santa vuelve** como zona completa:
   - Está en el catálogo, el selector (oeste), las favoritas, Zonas, Mar, el mapa, la demo, los textos en los dos idiomas, los tests y `verify:sources`.
   - Sale de `RETIRED_LOCATIONS`. Quien la tenía guardada desde antes de la fase 3 ya se había pasado a Famara; desde ahora se conserva.
   - **Datos**: el modelo del tiempo sigue sin distinguirla de Famara (la misma celda, 29,120 / −13,604), así que su tiempo coincide. Su mar se lee en una celda propia de mar abierto al oeste de la bahía (29,125 / −13,792; comprobada con oleaje y nivel), así que sus olas y su marea son suyas.
   - **Paisaje**:
     - horizonte nuevo, `bahia`: el Risco de Famara a lo lejos, a la derecha, subiendo hacia Peñas del Chache;
     - una plataforma baja de lava negra;
     - el pueblo de azoteas blancas, el malecón y una barca;
     - el islote con los bloques bajos del club deportivo;
     - **El Quemao**: una ola que solo rompe cuando hay mar (nivel 2 o más), más grande cuanto mayor es, y que crece y rompe despacio.

### Validación

- **Tests**: 117 de la web (antes 116). La Santa listada y conservada al guardarla, sin estación de AEMET representativa; además, los tests del mapa y de los paisajes ya la cubren. Lint, formato y build de producción sin avisos.
- **`verify:sources`** contra los API reales: 8 previsiones, 8 puntos de mar y 8 series de polvo. La Santa: olas de 1,82 m en su celda; Famara, 1,84 m en la suya.
- **En el navegador**:
  - La Santa en el selector, marcada como favorita y guardada, en el héroe («Hay olas», con la ola rompiendo) y en Mar (marea y estado del mar).
  - Mapa a 360, 390, 820 y 1440 px, en los temas claro y oscuro: 8 marcadores sin solapes ni recortes y etiquetas siempre por encima del viento.
  - 14 ráfagas animadas con 13 ritmos distintos, y ninguna con movimiento reducido.
- **axe** sin violaciones en las cuatro páginas y con el selector abierto, en español e inglés.

## Fase 7 — Ayúdanos a mejorar (23-10-2026)

### Hecho

1. **Sección nueva** «Ayúdanos a mejorar» / «Help us improve» en `/mejorar`:
   - Es la quinta pestaña. En la barra del móvil se lee «Mejorar» / «Improve»; en el raíl de escritorio, el nombre completo en dos líneas. La cápsula y la rejilla se adaptan al número de pestañas (`--count`).
   - Carga diferida, título de ruta traducido y la misma cabecera que el resto de páginas.
2. **Formulario** con Signal Forms (`@angular/forms/signals`):
   - Tipo de comentario en cuatro tarjetas sobre radios reales (Error, Sugerencia, Mejora, Otro). El texto de ayuda del mensaje cambia según el tipo elegido.
   - Mensaje de 10 a 2000 caracteres. El contador discreto se oscurece al 90 % y se pone rojo si se pasa. No se usa `maxlength`, que cortaría un texto pegado sin avisar; el error dice cuántos caracteres sobran.
   - Interruptor de anonimato, activado por defecto: checkbox nativo con `role="switch"`. Va a `_controls.scss` como `.switch` reutilizable.
   - Correo opcional, desactivado y atenuado mientras el envío es anónimo (sin salir del layout). Activar el anonimato lo borra.
   - Los errores aparecen al salir de un campo o al intentar enviar, y el foco va al primer campo con error. Los mensajes de error están enlazados con `aria-describedby` y `aria-invalid`.
   - Botón con dos caras (Enviar ↔ Enviando…) en la misma celda, así que no cambia de tamaño. Mientras envía queda `aria-disabled` y una región `status` lo anuncia.
   - La confirmación solo aparece si Web3Forms responde `success: true`. Lleva el disco y la marca dibujándose (el único momento animado), el foco pasa a su título y se ofrece «Enviar otro comentario».
   - Los errores se muestran en línea (`role="alert"`) y el mensaje se conserva.
   - Sin alertas nativas. Con `prefers-reduced-motion` desaparecen los desplazamientos y se conservan los fundidos.
3. **Privacidad**, visible en la propia página (columna lateral fija en escritorio): qué se envía, quién lo recibe (Web3Forms, con enlace a su política), que el anonimato del formulario no es anonimato técnico (IP y navegador), para qué se usan los datos, qué se guarda en el dispositivo y cómo pedir que se borre un mensaje. Además, una nota bajo el interruptor.
4. **Envío desacoplado** (`core/feedback`):
   - `FeedbackService` deja solo lo que puede salir del dispositivo (sin correo si es anónimo), aplica las reglas antirrepetición y une los envíos que llegan mientras otro sigue en curso.
   - `FeedbackTransport` es el puerto y `Web3FormsTransport` el adaptador. `provideFeedback()` los enlaza.
   - La clave se inyecta en el build (`--define QTH_WEB3FORMS_KEY`) y se valida como UUID. Sin clave, la página lo avisa y no envía nada, también en la build de demo.
5. **Antispam**:
   - El filtro de servidor de Web3Forms, más `botcheck: false`.
   - Un campo trampa propio.
   - Al menos 3 s desde que se abre el formulario, 30 s entre envíos y 5 por hora.
   - El mismo mensaje no se repite en 24 h (huella FNV-1a; el texto no se guarda).
6. **Traducciones completas** en español e inglés: 66 claves nuevas (títulos, tipos, campos, ayudas, validaciones, estados, errores y privacidad).

### Verificación de Web3Forms (23-10-2026)

- Documentación leída en docs.web3forms.com: API (`POST https://api.web3forms.com/submit`, JSON, respuestas 200/400/429/500), personalización, protección antispam (filtro de servidor, honeypot `botcheck`, hCaptcha gratis, reCAPTCHA/Turnstile de pago), restricción de dominio (de pago) y uso desde un servidor (de pago, con IP autorizada).
- La web de precios, los términos y la política de privacidad devolvieron 403 al consultarlas de forma automática. El plan gratuito (250 envíos/mes) y la conservación de 30 días se han contrastado con buscadores y reseñas; conviene revisarlos a mano antes de publicar.

### Validación

- **Tests**: 138 de la web (antes 117). Hay 21 nuevos: las reglas antirrepetición, el adaptador de Web3Forms con `fetch` simulado (contenido exacto del envío, éxito solo con `success: true`, 400/429/500, sin conexión y tiempo agotado) y el servicio (anonimato sin correo, campo trampa, sin clave, duplicados tras recargar, envíos simultáneos).
- **Lint**, **formato** y **build de producción** sin avisos (el SCSS del formulario queda dentro de los 6 kB). Sin clave, el bundle no contiene ninguna; con `--define`, la clave llega al bundle.
- **En el navegador** (Chrome sin interfaz, con Playwright; la extensión de Chrome no estaba conectada). Se usó una build de desarrollo con una clave ficticia y todas las peticiones a Web3Forms interceptadas: no salió ninguna. Se probaron 60 comprobaciones de extremo a extremo:
  - validación vacía, mensaje corto, mensaje demasiado largo y correo no válido;
  - el interruptor con el teclado (Espacio) y con la etiqueta;
  - borrar el correo al activar el anonimato;
  - el estado de carga y que un segundo clic no envíe dos veces;
  - el éxito con el foco en la confirmación y «enviar otro»;
  - el duplicado, la pausa de 30 s, el envío instantáneo y el campo trampa;
  - los errores 500, 200 sin `success`, 400 y 429, y sin red, con el mensaje conservado y sin éxito falso.
- **Capturas** a 360, 390, 1280 y 1440 px, en los temas claro y oscuro, en español e inglés. La barra de cinco pestañas no desborda en ninguna página.
- **axe** (WCAG 2.2 AA y buenas prácticas) sin violaciones en los estados inicial, con errores, error de envío y enviado. El detector de Impeccable, sin avisos.

### Pendiente

- Crear la clave de Web3Forms, compilar con ella y comprobar que los mensajes llegan de verdad al buzón (anónimo y con correo).
- Probar en dispositivos reales.

## Ajustes de Ayúdanos, menú y marea (23-10-2026)

### Hecho

1. **Menú**: la sección pasa a llamarse «Ayúdanos» / «Help us» (pestaña y título). Cabe entera en la barra del móvil, así que desaparece la etiqueta corta. Se probó llevarla al pie del raíl, junto a Ajustes, pero se queda arriba como última pestaña, en el raíl y en el móvil. En ventanas muy bajas el raíl se desplaza en vez de cortar Ajustes.
2. **Indicador de marea** (`.tide-gauge`): el `display: flex` anulaba el centrado de la rejilla y el conjunto quedaba pegado a la izquierda. Ahora el tubo y la flecha se centran como una sola figura. Se recortan los márgenes vacíos del icono de la flecha (5 de 24 unidades por lado) para centrar lo que se ve. Medido: 9,9 px a cada lado y 8 px arriba y abajo.
3. **Formulario más directo**:
   - Fuera el interruptor de envío anónimo: el correo es opcional y siempre editable.
   - Fuera la nota de anonimato y la columna de privacidad. La información sigue a un clic, en una línea discreta bajo el botón («Cómo tratamos tus datos», `<details>` nativo) con el enlace a la política de Web3Forms.
   - El formulario queda en una columna de 40 rem, con 1,5 rem entre bloques.
   - Se conservan las validaciones, los estados de envío y el antispam.
4. **Tarjetas de tipo**: el icono, el título sobre la ayuda y la marca de elección van en una fila centrada en vertical. La columna de la marca está siempre reservada, así que elegir una tarjeta no mueve el texto. Una por fila en el móvil y 2 × 2 desde 36 rem, todas de la misma altura.
5. Traducciones: se quitan 7 claves (anonimato, ayuda del correo anónimo, etiqueta corta) y se reescriben las de privacidad sin hablar de anonimato.

### Validación

- **Tests**: 139 en verde, con los del servicio adaptados al correo opcional. **Lint**, **typecheck** y **build de producción** sin avisos.
- **En el navegador**: Chrome sin interfaz por CDP, porque la extensión no estaba conectada. Capturas a 390, 600 y 1440 px, en español e inglés. Medido el centrado de la marea. Sin desbordamiento horizontal.
- **axe** (WCAG 2.2 AA y buenas prácticas) sin violaciones en Ayúdanos (inicial, y con errores y privacidad abierta) y en Hoy: 390 y 1440 px, temas claro y oscuro, español e inglés.

## Hora elegida y compartir el tiempo (24-10-2026)

### Hecho

1. **Reloj del héroe**: muestra la hora de lo que dibuja la escena. Ahora, «Ahora 10:13»; al elegir una hora, esa hora con su día («Hoy 15:00», «Mañana 05:00»), con su `datetime` y en hora de Canarias. «Volver a ahora» la devuelve a la actual. El cambio entra desde un leve desenfoque (WAAPI, 240 ms); la píldora no cambia de sitio.
2. **Botón Compartir** a la derecha de Ajustes: `.sky-button` como los demás, icono Share2 de Lucide, `aria-label` y tooltip en los dos idiomas («Compartir el tiempo en Famara», «Compartir la previsión de Famara» al ver otra hora). Si dibujar tarda, el icono pasa a un indicador de carga, anunciado a los lectores de pantalla. En móviles de menos de 23 rem los controles del cielo bajan a 2,25 rem para que quepan los cinco.
3. **Tarjeta para compartir** (`features/today/share`): 1200 × 1500 (4:5), dibujada en un canvas sin dependencias nuevas.
   - La escena es la del héroe, pintada con `shared/scene/scene-paint.ts` desde la misma geometría y colores, con cada cosa en su reposo: nunca un fotograma a medias.
   - Lo que deciden las capas (nubes visibles, barcos y velas, reflejo) sale de `shared/scene/layers.ts`, que ahora usan la escena viva y la tarjeta.
   - Lleva zona, día y fecha, hora o «Previsión», temperatura, veredicto y frase. Debajo, cielo con sensación, máxima y mínima; viento con rachas; mar y marea, solo si la página tiene esos datos, y la marea estimada dice que lo es.
   - Al pie, la marca, el lema, el enlace (si lo hay) y la fuente; en la demo, «Datos ficticios de demostración».
   - La hoja es de día o de noche según la luz de la escena.
4. **Compartir**:
   - Si el navegador puede adjuntar archivos (`navigator.canShare({ files })`), abre el menú del sistema con la imagen y el texto. El enlace va dentro del texto, porque algunas apps descartan la imagen si reciben un `url` aparte.
   - Cancelar no hace nada.
   - Si el navegador rechaza el gesto, una hoja permite volver a compartir la imagen.
   - Sin archivos, la hoja ofrece descargar la imagen, copiarla (si hay `ClipboardItem`), copiar el texto, compartir solo el texto y enviarlo por WhatsApp (`wa.me`), diciendo claro que WhatsApp recibe solo el texto.
   - La tarjeta empieza a dibujarse al acercar el puntero o el foco al botón, para que el menú se abra mientras el toque aún cuenta (Safari da poco margen).
5. **Texto**: «Así está el tiempo en Famara ☀️🌊.» o «Así estará el tiempo en Famara hoy a las 18:00 ☀️🌊.», más «Consulta la previsión completa de Lanzarote aquí: …» si hay enlace. Lo mismo en inglés. El emoji sale del cielo, de día o de noche, y del mar o del viento.
6. **Enlace**: `SHARE_CONFIG.publicUrl` en `core/share/share-config.ts`, ahora `null`. Mientras no tenga dirección, una copia desplegada comparte la suya; en local o en una red privada no se comparte ningún enlace, nunca uno inventado.

### Validación

- **Tests**: 148 en verde, con los nuevos del texto, el emoji, el nombre del archivo y el enlace. **Lint**, **formato** y **build de producción** sin avisos.
- **En el navegador**: Chrome sin interfaz por CDP, porque la extensión no estaba conectada.
  - Reloj con la hora actual, una hora de hoy, una de mañana y la vuelta a ahora.
  - Tarjetas de alisio, calma, ventoso, calima y borrasca en siete zonas, de día, al atardecer, al amanecer y de noche, en español e inglés: de 70 a 460 ms y unos 0,5 MB cada una.
  - El flujo con Web Share simulado (archivo y texto), cancelado y rechazado, y sin Web Share (la hoja, copiar texto, foco de vuelta al botón).
  - Sin desbordamiento horizontal a 320, 360, 390 y 1440 px.
- **axe** (WCAG 2.2 AA y buenas prácticas) sin violaciones en Hoy (ahora, una hora elegida y la hoja abierta): 390 y 1440 px, temas claro y oscuro, español e inglés.
- **Impeccable**: un único aviso, falso. La vista previa (`<img>`) recibe su `src` por enlace de datos y solo existe cuando lo tiene.

### Pendiente

- Poner la dirección pública en `SHARE_CONFIG` cuando exista.
- Probar en móviles reales: Android con Chrome y iPhone con Safari, enviando la tarjeta a WhatsApp.
