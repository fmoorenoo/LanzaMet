# Sistema de diseño — LanzaMet

Documentado a partir de lo construido. La fuente de verdad son los tokens de `src/styles/_tokens.scss`; este documento explica sus papeles y las reglas de uso.

## Dirección

**La escena es el dato.** La pantalla principal no muestra un fondo decorativo: dibuja el día a partir de la previsión. El cielo depende de la hora y del sol de la zona; las nubes, la calima y la lluvia, de las condiciones; la velocidad de las nubes, del viento; la amplitud de las olas, del estado del mar, y el nivel del agua sobre la orilla, de la marea. Cada zona tiene su horizonte (La Graciosa desde el norte, el Risco sobre Famara, Fuerteventura desde el sur, Lobos desde la Bocaina, los volcanes de Timanfaya) y su paisaje propio: el Gran Hotel sobre El Reducto, el paseo de palmeras de Puerto del Carmen, el faro de Pechiguera, las escolleras y los windsurfistas de Las Cucharas, el muelle de Órzola o el medio cráter de El Golfo con el Charco de los Clicos. Se dibujan con las mismas formas planas que el resto de la escena y toman su luz: cal al sol, tonos cálidos al atardecer, ventanas encendidas de noche.

Las palabras van primero ("Hoy apetece playa") y los números después. Nunca se muestran grados de dirección, presión, coordenadas ni códigos meteorológicos.

El mundo visual sale de la isla: blanco de cal, negro de picón, verde de las ventanas tradicionales (la estética de Manrique), ocre de Timanfaya y azul atlántico. No hay glassmorphism decorativo, texto con degradado, *eyebrows* sobre los títulos ni rejillas de tarjetas idénticas.

## Color (OKLCH)

| Rol | Día | Noche | Uso |
|---|---|---|---|
| `--c-ground` | cal 50 | noche 900 | Fondo de página |
| `--c-surface` / `-sunken` / `-raised` | blanco / cal 100 / blanco | noche 800 / 700 / — | Hojas, filas, medidores |
| `--c-ink` / `-2` / `-3` | picón 900 / 600 / 500 | crema / gris azulado | Texto principal, secundario y terciario |
| `--c-accent` | verde Manrique 600 | verde 300 | Acciones, selección, enlaces, día marcado |
| `--c-focus` | atlántico 500 | atlántico 400 | Anillo de foco |
| `--c-sea` | atlántico | atlántico claro | Mareas, olas, viento en el mapa |
| `--c-good` / `-fair` / `-poor` | verde charco / ámbar / lava | versiones claras | Calidad de una zona, siempre acompañada de texto |

- Contraste medido sobre el render: todos los pares de texto ≥ 5,3:1 en ambos temas. El texto sobre la escena da ≥ 4,5:1 en los cinco escenarios, de amanecer a noche, a 360, 390 y 1440 px.
- El tema oscuro es una noche volcánica compuesta a propósito, no una inversión. Sigue al sol de la zona elegida (*Según la hora*) o se fija desde Ajustes.
- La escena mezcla en OKLab: la arena que se oscurece de noche pasa por el gris, no por el verde. Las paletas del cielo son fotogramas clave anclados al amanecer, al mediodía y al atardecer.

## Tipografía

Una sola familia: **Bricolage Grotesque** variable (peso, anchura y tamaño óptico), auto-alojada. El tamaño óptico separa el *display* del texto.

| Rol | Tamaño | Peso / tracking | Uso |
|---|---|---|---|
| `.t-hero` | clamp(5,75–9 rem) | 300, anchura 92 %, −0,04 em | Temperatura |
| `.t-display` | 2 rem (2,5 rem en ≥ 48 rem) | 680, −0,03 em | Veredicto, título de página |
| `.t-title` | 1,375 rem | 640, −0,018 em | Secciones |
| `.t-lead` | 1,125 rem | 450 | Frase de apoyo |
| `.t-body` / `.t-small` / `.t-micro` | 1 / 0,875 / 0,8125 rem | 400–520 | Texto y metadatos |

Los títulos usan `text-wrap: balance` y los párrafos `pretty`. Las cifras de tablas y horas llevan `.t-num` (cifras tabulares).

## Espacio, forma y profundidad

- Escala de 4 px (`--s-1` … `--s-16`); margen lateral de 1,25 rem en móvil y 2 rem en pantallas mayores.
- Radios generosos, como los muros de Manrique: de 0,5 a 2 rem, más el radio de píldora.
- Sombras siempre con desplazamiento y difuminado (`--shadow-1`, `-2`, `-sheet`). Sin materiales translúcidos: la barra inferior es opaca (`--c-surface` con un filete `--c-line-strong`), así que nada de la página se ve a través de ella.

## Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` | cubic-bezier(0.23, 1, 0.32, 1) | Entradas, pulsaciones |
| `--ease-in-out` | cubic-bezier(0.77, 0, 0.175, 1) | Movimiento en pantalla (sol, marea) |
| `--ease-drawer` | cubic-bezier(0.32, 0.72, 0, 1) | Hojas |
| `--d-press` · `--d-fast` · `--d-base` | 140 · 180 · 240 ms | Respuesta, color, cambios de estado |
| `--d-sheet` · `--d-atmos` · `--d-tide` | 460 ms · 900 ms · 1,4 s | Hojas, cambio de luz, nivel del agua |

Reglas:

- Solo `transform` y `opacity`. Excepciones justificadas: los colores del cielo (`@property`, `inherits: false`), `d` en las olas y el `clip-path` de la curva de marea.
- Pulsar algo da `scale(0.94–0.98)`. Nunca se anima desde `scale(0)` y nunca se usa `ease-in`. La salida es más rápida que la entrada.
- Escape cierra al instante, sin animación. La hoja se arrastra para cerrarla: basta un gesto rápido (> 0,11 px/ms) o desplazarla un 30 %.
- Las tiras horizontales funden sus bordes (`--fade-back` / `--fade-forward`, registradas con `@property` para que el fundido se anime) solo mientras queda contenido en esa dirección. Con ratón se arrastran: por debajo de 5 px es un clic, y una suelta rápida (> 0,35 px/ms) conserva algo de inercia, salvo con `prefers-reduced-motion`.
- La píldora del selector de idioma y el sol del arco de amanecer se desplazan con `--ease-in-out` (240 ms y 900 ms); sin movimiento si se pide menos movimiento.
- Los bucles ambientales (nubes, olas) usan WAAPI con `updatePlaybackRate`, así un cambio de viento no produce saltos. Se pausan fuera de pantalla y en pestañas ocultas.
- Con `prefers-reduced-motion` se conservan los fundidos de color y opacidad; desaparecen los desplazamientos y los bucles.
- Hover solo con `(hover: hover) and (pointer: fine)`.

## Componentes

| Componente | Archivo | Notas |
|---|---|---|
| Escena | `shared/scene` | `full` (animada) / `mini` (tarjetas); oculta a lectores de pantalla. Paisajes por zona en `scenery.ts`: siete primitivas, un `path` por papel, calculados una vez |
| Tooltip | `shared/ui/tooltip` | Directiva `lmTooltip` para botones solo con icono: ratón (450 ms) y teclado, Escape, en la capa superior, oculta a lectores de pantalla (el botón lleva su `aria-label`); sin `title` |
| Hoja | `shared/ui/sheet` | `<dialog>` nativo, inferior en móvil y centrada en escritorio |
| Icono | `shared/ui/icon` | Lucide para la interfaz + iconos propios de identidad; ver «Iconos» |
| Glifo del cielo | `shared/ui/sky-glyph` | Bicolor: sol cálido, luna pálida, nubes que los tapan |
| Mensaje de estado | `shared/ui/status-message` | Vacío (`status`) / error (`alert`) con acción de recuperación |
| Recomendación | `shared/plans/plan-item` | Fila, o "lead" con miniescena |
| Arco del sol | `shared/ui/sun-path` | Amanecer y atardecer reales, el tramo recorrido y cuánto queda; sin datos, lo dice |
| Scroll horizontal | `shared/ui/horizontal-scroll` | Directiva (bordes fundidos; arrastre con ratón que, al soltar, sigue con la inercia de la mano y se frena con `--ease-out`, sin ajuste a rejilla) + botones anterior/siguiente |
| Selector de idioma | `layout/language-selector` | Segmentado sobre radios reales; cada idioma escrito en su lengua, sin banderas |
| Controles sobre el cielo | `styles/_sky-controls.scss` | `.sky-chip`, `.sky-button`: toman la tinta de la escena; `.sky-badge`, la misma píldora para texto que no es un control (la hora) |
| Controles | `styles/_controls.scss` | `.btn`, `.icon-btn`, `.chip`, `.choice`, `.field`, `.switch`, `.skeleton`, `.pendable` |
| Interruptor | `styles/_controls.scss` | `.switch`: checkbox nativo con `role="switch"` y la pista y el pulgar dibujados debajo. Pista apagada en `--c-ink-3` (borde ≥ 3:1 en los dos temas) y encendida en `--c-accent`. El pulgar se desliza en 240 ms con `--ease-out`; con menos movimiento salta y solo funde el color |
| Comentarios | `features/feedback` | Tarjetas de tipo sobre radios reales, cada una en una fila (icono a la izquierda, título sobre la ayuda y la marca a la derecha, siempre reservada; una por fila en móvil y 2 × 2 desde 36 rem; la elegida, en verde, con una marca que crece desde 0,6), mensaje con contador discreto y un error que dice cuánto sobra, correo opcional sin más condiciones, botón con dos caras en la misma celda (Enviar ↔ Enviando…, fundido con desenfoque, sin cambiar de tamaño) y una confirmación con el único momento animado de la página: el disco crece y la marca se dibuja. La privacidad va plegada en una línea discreta bajo el botón («Cómo tratamos tus datos», `<details>` nativo) |
| Compartir el tiempo | `features/today/share` | Botón del cielo a la derecha de Ajustes. Dibuja en un canvas una tarjeta 4:5 (1200 × 1500) con la misma escena (`shared/scene/scene-paint.ts`: mismas capas, colores y geometría que la escena viva, con nubes, olas, barcos y lluvia en su reposo, nunca un fotograma a medias), las palabras sobre el cielo como en el héroe y una hoja con cielo, viento, mar y marea (solo las que tienen datos) y la marca. La hoja es de día o de noche según la luz de la escena. Comparte con el menú del sistema (Web Share con archivo) y, si el navegador no puede adjuntar la imagen, abre una hoja para descargarla o copiarla y copiar o enviar el texto, diciendo que la imagen va aparte. El enlace sale de `SHARE_CONFIG` (`core/share/share-config.ts`) |
| Instalar la web | `layout/install` | **Acceso rápido** en Ajustes: una fila con el icono de la app (`AppTile`, la marca a 2,75 rem con su sombra), título, frase y un botón (Instalar, primario, o Ver cómo); en una hoja estrecha el botón baja bajo el texto, alineado con él (container query a 25 rem). **Guía**: hoja sobre Ajustes (velo más ligero: `Sheet` marca `is-stacked` si ya hay otra abierta), el icono a 4 rem con su nombre como en una pantalla de inicio, un segmentado iPhone o iPad · Android · Ordenador y pasos en lista ordenada: a la izquierda, en una baldosa hundida, el icono que hay que buscar (Lucide: Compartir de iOS, añadir, menú de puntos o de rayas, instalar en escritorio, marcador) y un hilo de 1 px que une los pasos; en el ordenador, «Como app» y «En marcadores», con el atajo en `<kbd>`. **Invitación**: tarjeta `surface-raised` con `shadow-2` y radio `r-lg`, sobre la barra de pestañas o en la esquina en escritorio; entra desde 0,75 rem y 0,98 (280 ms, `--ease-out`) y sale más deprisa (180 ms). El único momento animado de la función: la marca verde que crece en la esquina del icono al instalarla (desde 0,6, 280 ms) |

Cada sección contempla carga (esqueleto con la forma del contenido), datos, vacío (sin cobertura: se explica y se ofrece la alternativa más cercana), error (con Reintentar) y actualización (los datos anteriores siguen visibles, atenuados, mientras llegan los nuevos).

## Adaptación

- **Móvil (base, por debajo de 64 rem):** la primera pantalla de Hoy es la escena y, justo debajo, las 24 horas que la cambian: elegir una hora nunca obliga a subir para verla. Barra de pestañas inferior, opaca y con zonas seguras: cinco pestañas, «Ayúdanos» («Help us») la última. Ajustes no está en la barra: se abre desde la escena.
  - **Altura de la escena:** lo que deja la pantalla tras la barra y las horas (`100svh − --tabbar-h − --safe-bottom − --hours-peek`, con `--hours-peek` de 13 rem, el alto real del encabezado y una fila de horas), y nunca menos de lo que pide su contenido. Sin alturas fijas por dispositivo. Medido con el veredicto más largo: las horas enteras en la primera pantalla de 360 × 780, 390 × 844 y 430 × 932; en 375 × 667 se ven las horas y sus iconos y asoma la temperatura; en 320 × 568, el encabezado y el comienzo de la fila.
  - **Orden:** fila 1, la zona con su nombre entero y su estrella, y la hora a la derecha; fila 2, favoritas o la hora elegida con «Volver a ahora»; la temperatura, el veredicto, la frase y la máxima y mínima; abajo a la derecha, sobre el mar y al alcance del pulgar, Ajustes y Compartir (siempre con tinta clara: el agua es más oscura que el cielo para el que se elige la tinta). Las horas van primero en la hoja (`order: -1`); el orden del DOM y del foco es el de escritorio.
  - **Horizonte:** anclado abajo (`calc(100% − --sea-band)`, con `--sea-band` de `clamp(6rem, 14svh, 10rem)`), con 2,5 rem de cielo libre (`--sky-gap`) entre el texto y el horizonte para lo que asoma sobre él: palmeras, el faro, el Gran Hotel, el borde del cráter.
  - **Sin saltos:** el veredicto reserva siempre dos líneas (`min-height: 2lh`, alineado abajo), así que cambiar de hora o de zona no mueve las horas que se están tocando. Comprobado en ocho zonas y ocho horas seguidas a 320, 375 y 390 px: 0 px.
  - **Pantallas bajas** (alto ≤ 46 rem): temperatura, veredicto y márgenes un punto más compactos.
- **Tableta (≥ 48 rem):** el mismo flujo con una medida de lectura más tranquila.
- **Escritorio (≥ 64 rem):** raíl lateral. Arriba, las cinco pestañas, con «Ayúdanos» la última; Ajustes, solo al pie. En ventanas muy bajas el raíl se desplaza en vez de cortar Ajustes. En Hoy, la escena es una banda panorámica (≈ 3:1, `clamp(26rem, 54vh, 32rem)` de alto) en un contenedor de 84 rem: zona, favoritas y acciones en una línea; la temperatura junto al veredicto, con la máxima y la mínima; el cielo de la derecha queda para el sol y la luna. Debajo, «ahora» (viento, mar y marea en tres columnas desde 72 rem), las 24 horas a todo el ancho —justo bajo la escena que previsualizan— y una rejilla de dos columnas: planes y detalle a la izquierda, los siete días a la derecha. El orden del DOM y del foco es el de móvil. Zonas y Mar pasan a dos columnas a partir de 72 rem.
- **Horas:**
  - Cada hora mide 3,75 rem en móvil y 4,5 rem en escritorio, con glifos de 2 y 2,375 rem.
  - Las filas de cada hora son variables CSS, y de ellas se deriva la posición de la curva de temperatura: cambiar un tamaño no descoloca los puntos.
  - La curva se dibuja en unidades de hora y se estira al ancho; sus puntos son HTML y siguen redondos a cualquier ancho.
  - El resaltado va hundido unos píxeles a cada lado, para que las horas vecinas respiren.
  - Cada hora lleva un borde de 1 px en `--c-accent-soft`, el mismo tono que el relleno de la elegida. La elegida conserva ese relleno y pasa a `--c-accent`: más oscuro de día y más luminoso de noche, siempre el verde más visible del tema.
- **Controles sobre la escena:** `--sky-control-h` (2,5 rem) es la altura de todas las píldoras y botones redondos del cielo (zona, favoritas, estrella, ajustes, compartir), así que se alinean en cualquier idioma. En escritorio comparten una fila y se centran en ella. Por debajo de 23 rem bajan a 2,25 rem, se acercan y la zona pierde el chevron y el alfiler, para que su nombre se lea entero. Con pantalla táctil (`pointer: coarse`) cada uno responde en 44 px gracias a un anillo invisible (`::after`, en porcentajes de su caja de relleno), sin parecer más grande; los `.chip`, igual en vertical, y los campos de texto llenan su píldora. Con pantalla táctil () cada uno responde en 44 px gracias a un anillo invisible (, en porcentajes de su caja de relleno), sin parecer más grande; lo mismo los , en vertical.
- **Hora actual:**
  - En Hoy va en la esquina superior derecha (en escritorio, delante de favorita, ajustes y compartir; en móvil, sola a la derecha de la fila de la zona), como una píldora `.sky-badge` (mismo fondo, borde, altura y radio que esos botones): «Ahora 14:36», o «En Lanzarote» si el reloj de quien visita marca otra hora.
  - Es la hora de lo que dibuja la escena: al previsualizar una hora muestra esa hora con su día («Hoy 18:00», «Mañana 05:00») y vuelve a la actual con «Volver a ahora». Cada cambio entra desde un leve desenfoque (240 ms, `--ease-out`).
  - En móviles estrechos muestra solo la hora.
  - En la marea, la marca de «ahora» baja del punto de la curva al eje, donde va la hora, y las horas del eje que taparía se apartan. Si la etiqueta de una bajamar profunda llegaría a la píldora (pasa en móvil, con la gráfica más baja), sube lo justo para dejarla libre, sin dejar de estar bajo su punto; mientras no se tocan, nada se mueve.
- **Mapa de Zonas:**
  - La tierra va en `--c-land` (arena volcánica de día, picón de noche) y los islotes en `--c-land-islet`.
  - El mar tiene franjas de agua somera y ondas estáticas.
  - El viento son ráfagas sueltas por encima de la tierra y por debajo de los marcadores.
- **Paisaje en pantallas estrechas:**
  - La tierra se ancla a la derecha (`xMaxYMax slice`), donde están los hitos.
  - Lo alto va a la derecha de x = 1000 y lo blanco queda bajo, porque en móviles bajos el texto llega al horizonte.
- **Lluvia:** trazos sueltos con tres profundidades, siempre con la misma inclinación (40 de ancho por cada 60 de alto). La densidad sigue a la intensidad y solo se anima `transform`.
- **Estabilidad:** lo que aparece o desaparece no mueve nada.
  - Los controles que van y vienen están siempre en el layout y solo cambian de opacidad y visibilidad («Volver a ahora»).
  - Los contenidos que se turnan comparten una ranura cuya altura sale de su propio contenido (la fila de favoritas y la hora previsualizada).
  - La barra de desplazamiento tiene su carril reservado (`scrollbar-gutter: stable`), así que una hoja modal no ensancha la página.

## Iconos

- **Lucide** (ISC, versión fijada) para la interfaz: chevrons, cerrar, buscar, estrella, ubicación, actualizar, ajustes, información, aviso, flechas, viento, termómetro, gota, sol, amanecer y atardecer, mapa, brújula, huellas, escudo, idiomas y, en Comentarios, bicho, bombilla, brote, bocadillo, enviar, carga, correo y escudo con marca; al compartir, compartir, descargar, copiar e imagen, y al instalar, los que dibujan los navegadores: Compartir de iOS, cuadrado con más, casa con más, menú de tres puntos y de tres rayas, monitor con descarga y marcador. Se importan uno a uno; solo los usados llegan al bundle.
- **Propios** donde dan identidad o Lucide no tiene nada tan preciso: Hoy (el sol sobre el horizonte), el mar y las olas, la marea subiendo y bajando, la sombrilla, el bañista y el surf. Dibujados en la misma rejilla.
- Los glifos del cielo, la marca y la escena son ilustraciones, no iconos, y no se sustituyen.
- Rejilla de 24, trazo 1,75 para todos, extremos y uniones redondeados, color `currentColor`. Tamaño por rol: `--icon-xs` 1 rem (con texto micro) · `--icon-sm` 1,125 rem (etiquetas, chips) · `--icon-md` 1,25 rem (chevrons de fila) · `--icon-lg` 1,375 rem (pestañas, avisos, estados) · `--icon-xl` 1,5 rem (por defecto). Se alinean al centro de la línea con `inline-flex` y `gap`.
- Un icono es decorativo salvo que lleve `label`; el texto de al lado dice lo mismo.

## Identificadores

Para encontrar cada pieza con las herramientas del navegador:

- **IDs** en inglés y `kebab-case`, solo para lo único de cada página: `weather-hero`, `weather-landscape`, `current-temperature`, `weather-verdict`, `weather-description`, `temperature-range`, `location-selector`, `location-selector-button`, `hourly-forecast`, `current-conditions`, `sun-times`, `daily-forecast`, `tide-visualization`, `tide-extremes`, `language-selector`, `theme-selector`, `main-navigation`…
- **Clases** semánticas y reutilizables para lo repetido (`hour-cell`, `day-row`, `zone-card`, `map-marker`, `location-option`, `plan-card`, `weather-warning`, `tide-extreme`…), añadidas junto a las clases internas cortas, que no cambian.
- **`data-*`** para identificar cada instancia: `data-location-id`, `data-index` / `data-time` (horas), `data-date` (días), `data-plan-kind`, `data-tide` (`high` / `low`), `data-level` (avisos), `data-condition`, `data-route`, `data-area`, `data-kind` (tipo de comentario). La escena expone lo que dibuja: `data-variant`, `data-horizon`, `data-scenery`, `data-sea-level`, `data-ink`. La hora: `current-time` y `tide-now-time`.

## Voz

La interfaz habla español (por defecto) e inglés británico (reloj de 24 h, como en la isla). Español de la isla, breve y concreto: "Mar como un plato", "Llueve, cosa rara", "El viento se está levantando". En inglés, el mismo tono, sin traducir palabra por palabra: "Flat as a mirror", "Rain, for once", "The wind is picking up"; los nombres de lugar y "calima" no se traducen. Las alturas se dan en palabras de playa ("Olas de unos 40 cm"). Cada dato dice de dónde sale: la previsión lleva su fuente y la hora de consulta en el pie de cada página; una estimación se dice como tal ("Bajamar hacia las 17:30", "Pleamares y bajamares (estimadas)"); una medida lleva su estación y su hora; un aviso oficial, su emisor. En la build de demo, los datos ficticios se declaran como tales.
