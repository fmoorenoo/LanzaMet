# Sistema de diseño — LanzaMet

Documentado a partir de lo construido. La fuente de verdad son los tokens de `src/styles/_tokens.scss`; este documento explica sus papeles y las reglas de uso.

## Dirección

**La escena es el dato.** La pantalla principal no muestra un fondo decorativo: dibuja el día a partir de la previsión. El cielo depende de la hora y del sol de la zona; las nubes, la calima y la lluvia, de las condiciones; la velocidad de las nubes, del viento; la amplitud de las olas, del estado del mar, y el nivel del agua sobre la orilla, de la marea. Cada zona tiene su horizonte (La Graciosa desde el norte, el Risco sobre Famara, Fuerteventura desde el sur, Lobos desde la Bocaina, los volcanes de Timanfaya) y su paisaje propio: el Gran Hotel sobre El Reducto, el paseo de palmeras de Puerto del Carmen, el faro de Pechiguera, las escolleras y los windsurfistas de Las Cucharas, el muelle de Órzola o el medio cráter de El Golfo con el Charco de los Clicos. Arrieta se ve desde el agua: la arena de La Garita al sur, el pueblo blanco, el muelle con su luz y sus barcas, la Casa Juanita azul sobre las rocas y, detrás, las laderas del macizo de Haría hasta Monte Corona. Toman la luz de la escena: cal al sol, tonos cálidos al atardecer, ventanas encendidas de noche.

**Atlántico a contraluz** (fase 8). La escena deja de ser una pila de formas planas y se construye con perspectiva atmosférica, como se ve la isla desde la orilla: la sierra lejana se funde en el aire al pie (`farMist`), una neblina separa lo lejano de lo cercano, la tierra cercana recibe luz en su cresta, el horizonte tiene un resplandor (cálido con el sol bajo, un filo pálido de día) y una línea de luz donde el mar toca el cielo; el sol tiene núcleo, borde y un halo amplio; las nubes son cúmulos de base plana, iluminados arriba y en sombra abajo; el mar refleja el cielo bajo junto al horizonte y se oscurece hacia la orilla, y las franjas de mar de fondo se funden en el agua en lugar de acabar en un borde, con un brillo fino en las crestas. Todo son degradados SVG y CSS (ids únicos por escena); sin filtros ni desenfoques. La tarjeta para compartir pinta las mismas capas.

**Detalle** (mismo estilo plano, más oficio): la tierra cercana tiene modelado (`relief()` en `geometry.ts`): una banda de luz en la cresta y una de sombra al pie que siguen el contorno, barrancos que bajan por las laderas empinadas (más densos cuanto más empinada, cada uno con su arista de luz) y espuma donde la tierra toca el agua; la sierra lejana lleva una segunda línea de colinas más cercana. Las casas tienen puerta y contraventanas en verde Manrique y, algunas, la chimenea blanca de la isla (cuáles, según dónde están: siempre las mismas). Las palmeras tienen copa llena de hojas rellenas. El paisaje se refleja en el agua (la misma tierra, invertida, aplastada y tenue) y el mar abierto lleva pequeñas ondas de luz. En pantallas anchas la tierra mide hasta 13 rem de alto.

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
- La escena mezcla en OKLab: la arena que se oscurece de noche pasa por el gris, no por el verde. En CSS, un tinte sobre blanco se mezcla `in oklab`: `in oklch` contra un blanco de matiz 0 hace girar el color (el azul del mar pasaba por el rosa). Las paletas del cielo son fotogramas clave anclados al amanecer, al mediodía y al atardecer.

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

### Jerarquía del héroe

| Rol | Tamaño | Peso / tracking |
|---|---|---|
| Zona (el botón que abre el selector) | clamp(1,5–2,125 rem) · 2,25 rem en escritorio | 660, −0,028 em |
| Temperatura | `.t-hero`, clamp(4,75–8 rem) en móvil · 8,5 rem en escritorio | 300 |
| Cielo en palabras | `--fs-title` | 620, −0,016 em |
| Viento (cifra) | 1,75 rem | 640, −0,03 em |
| Veredicto | 1,75 rem · 2 rem en tableta · 2,75 rem en escritorio | 680, −0,026 em |
| Hora | 1,5 rem, con su etiqueta («Ahora», «Hoy») en `--fs-small` | 640, −0,02 em |

Tres tintas sobre el cielo, para que no todo tenga el mismo peso: blanco (`--hero-ink`) para lo que se lee primero (zona, temperatura, viento, veredicto, hora); arena (`--hero-warm`) para el cielo en palabras y «Volver a ahora»; un tono frío y pálido (`--hero-ink-2`) para lo que acompaña (etiquetas, máxima y mínima, unidades, la frase). Con un cielo claro, las tres pasan a tintas oscuras en los mismos papeles. Todas mantienen 4,5:1 sobre el cielo con la sombra y el halo.

## Escala del viento

Beaufort (OMM) agrupada en cinco pasos, los que se notan en una playa (`WIND_LEVEL_MAX` en `wind.insight.ts`):

| Nivel | Palabra | km/h | Beaufort |
|---|---|---|---|
| 0 | Calma | < 6 | 0–1 |
| 1 | Flojo | 6–19 | 2–3 |
| 2 | Moderado | 20–28 | 4 |
| 3 | Fuerte | 29–49 | 5–6 |
| 4 | Muy fuerte | ≥ 50 | 7+ |

El nivel decide los veredictos y las recomendaciones; la palabra va junto a la cifra en el héroe y en Dónde ir.

**Color del viento** (`windHue`): cada velocidad tiene su matiz, verde con poco viento, amarillo y naranja al volverse moderado, rojo cuando es fuerte (0 km/h → 150°, 12 → 138°, 20 → 95°, 29 → 60°, 40 → 38°, ≥ 50 → 25°, interpolado). El fondo y la tinta los fijan los tokens `--wind-bg-*` y `--wind-ink-*` por tema, así que cualquier matiz da el mismo contraste (≥ 7:1). Las etiquetas largas son «Viento flojo», «Viento moderado»…; en las frases se conserva la voz de la isla («brisa suave»).

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
| Escena | `shared/scene` | `full` (animada) / `mini` (tarjetas); oculta a lectores de pantalla. Paisajes por zona en `scenery.ts`: primitivas (casas, pueblos, torre, palmera, faro, escollera, casa pintada, arena) y un `path` por papel, calculados una vez. Capas de luz: resplandor del horizonte, halo del sol, neblina, línea del horizonte y degradados por capa en tierra, nubes y mar |
| Instrumento de viento | `shared/ui/wind-gauge` | Flecha hacia donde sopla en un círculo de 2,75 rem (gira, 600 ms `--ease-in-out`), la cifra a 2,5 rem con «km/h», la intensidad en una píldora de su color (`windHue`; sobre el cielo, siempre el tinte claro) y una rampa de cinco barras en ese mismo color, llenas según lo avanzado dentro de cada nivel (`windSteps`). Debajo, dirección y rachas en la tinta secundaria. `compact`: una línea para tarjetas, sin barras, con la píldora en los tokens del tema |
| Tarjeta de Dónde ir | `features/plans/plan-card` | Una fila: a la izquierda, el paisaje del lugar con la luz de ahora (escena `mini`) en una columna estrecha (9,5 rem; 6,5 en móvil), con la isla en miniatura (3,75 rem) y el lugar en un punto rojo grande con halo, y el tipo de plan en la esquina; a la derecha, título, motivo, franja horaria y, tras un filete, temperatura, viento (instrumento `compact`) y mar para comparar. `lead`: el paisaje ocupa algo menos de la mitad (13 rem de alto) y el título va en `--fs-display`; en móvil se apila con una banda de paisaje de 8,5 rem |
| Curva de marea | `features/sea/tide-chart` | Interpolación cúbica monótona (Fritsch–Carlson, `core/utils/curve.ts`) por la serie horaria y las pleamares y bajamares estimadas: pasa por cada valor, no inventa crestas ni valles entre horas y es plana en cada pleamar y bajamar. «Ahora» se sitúa sobre la curva dibujada |
| Tooltip | `shared/ui/tooltip` | Directiva `lmTooltip` para botones solo con icono: ratón (450 ms) y teclado, Escape, en la capa superior, oculta a lectores de pantalla (el botón lleva su `aria-label`); sin `title` |
| Hoja | `shared/ui/sheet` | `<dialog>` nativo, inferior en móvil y centrada en escritorio |
| Icono | `shared/ui/icon` | Lucide para la interfaz + iconos propios de identidad; ver «Iconos» |
| Glifo del cielo | `shared/ui/sky-glyph` | Bicolor: sol cálido, luna pálida, nubes que los tapan |
| Mensaje de estado | `shared/ui/status-message` | Vacío (`status`) / error (`alert`) con acción de recuperación |
| Recomendación | `shared/plans/plan-item` | Fila, o "lead" con miniescena |
| Arco del sol | `shared/ui/sun-path` | Amanecer y atardecer reales, el tramo recorrido y cuánto queda; sin datos, lo dice |
| Scroll horizontal | `shared/ui/horizontal-scroll` | Directiva (bordes fundidos; arrastre con ratón que, al soltar, sigue con la inercia de la mano y se frena con `--ease-out`, sin ajuste a rejilla) + botones anterior/siguiente |
| Selector de idioma | `layout/language-selector` | Segmentado sobre radios reales; cada idioma escrito en su lengua, sin banderas |
| Controles sobre el cielo | `styles/_sky-controls.scss` | `.sky-button` (Compartir, Ajustes): redondo, con la tinta de la escena; la zona, la estrella, la hora y las favoritas son texto e iconos sin píldora |
| Controles | `styles/_controls.scss` | `.btn`, `.icon-btn`, `.chip`, `.choice`, `.field`, `.switch`, `.skeleton`, `.pendable` |
| Interruptor | `styles/_controls.scss` | `.switch`: checkbox nativo con `role="switch"` y la pista y el pulgar dibujados debajo. Pista apagada en `--c-ink-3` (borde ≥ 3:1 en los dos temas) y encendida en `--c-accent`. El pulgar se desliza en 240 ms con `--ease-out`; con menos movimiento salta y solo funde el color |
| Comentarios | `features/feedback` | Tarjetas de tipo sobre radios reales, cada una en una fila (icono a la izquierda, título sobre la ayuda y la marca a la derecha, siempre reservada; una por fila en móvil y 2 × 2 desde 36 rem; la elegida, en verde, con una marca que crece desde 0,6), mensaje con contador discreto y un error que dice cuánto sobra, correo opcional sin más condiciones, botón con dos caras en la misma celda (Enviar ↔ Enviando…, fundido con desenfoque, sin cambiar de tamaño) y una confirmación con el único momento animado de la página: el disco crece y la marca se dibuja. La privacidad va plegada en una línea discreta bajo el botón («Cómo tratamos tus datos», `<details>` nativo) |
| Compartir el tiempo | `features/today/share` | Botón del cielo a la derecha de Ajustes. Dibuja en un canvas una tarjeta 4:5 (1200 × 1500) con la misma escena (`shared/scene/scene-paint.ts`: mismas capas, colores y geometría que la escena viva, con nubes, olas, barcos y lluvia en su reposo, nunca un fotograma a medias), las palabras sobre el cielo como en el héroe y una hoja con cielo, viento, mar y marea (solo las que tienen datos) y la marca. La hoja es de día o de noche según la luz de la escena. Comparte con el menú del sistema (Web Share con archivo) y, si el navegador no puede adjuntar la imagen, abre una hoja para descargarla o copiarla y copiar o enviar el texto, diciendo que la imagen va aparte. El enlace sale de `SHARE_CONFIG` (`core/share/share-config.ts`) |
| Instalar la web | `layout/install` | **Acceso rápido** en Ajustes: una fila con el icono de la app (`AppTile`, la marca a 2,75 rem con su sombra), título, frase y un botón (Instalar, primario, o Ver cómo); en una hoja estrecha el botón baja bajo el texto, alineado con él (container query a 25 rem). **Guía**: hoja sobre Ajustes (velo más ligero: `Sheet` marca `is-stacked` si ya hay otra abierta), el icono a 4 rem con su nombre como en una pantalla de inicio, un segmentado iPhone o iPad · Android · Ordenador y pasos en lista ordenada: a la izquierda, en una baldosa hundida, el icono que hay que buscar (Lucide: Compartir de iOS, añadir, menú de puntos o de rayas, instalar en escritorio, marcador) y un hilo de 1 px que une los pasos; en el ordenador, «Como app» y «En marcadores», con el atajo en `<kbd>`. **Invitación**: tarjeta `surface-raised` con `shadow-2` y radio `r-lg`, sobre la barra de pestañas o en la esquina en escritorio; entra desde 0,75 rem y 0,98 (280 ms, `--ease-out`) y sale más deprisa (180 ms). El único momento animado de la función: la marca verde que crece en la esquina del icono al instalarla (desde 0,6, 280 ms) |

Cada sección contempla carga (esqueleto con la forma del contenido), datos, vacío (sin cobertura: se explica y se ofrece la alternativa más cercana), error (con Reintentar) y actualización (los datos anteriores siguen visibles, atenuados, mientras llegan los nuevos).

## Adaptación

- **Móvil (base, por debajo de 64 rem):** la primera pantalla de Hoy es la escena y, justo debajo, las 24 horas que la cambian: elegir una hora nunca obliga a subir para verla. Barra de pestañas inferior, opaca y con zonas seguras: cinco pestañas, «Ayúdanos» («Help us») la última. Ajustes no está en la barra: se abre desde la escena.
  - **Altura de la escena:** lo que deja la pantalla tras la barra y las horas (`100svh − --tabbar-h − --safe-bottom − --hours-peek`, con `--hours-peek` de 11,5 rem (13 antes de que las horas fueran más bajas), el alto real del encabezado y una fila de horas), y nunca menos de lo que pide su contenido. Sin alturas fijas por dispositivo. Medido con el veredicto más largo: las horas enteras en la primera pantalla de 360 × 780, 390 × 844 y 430 × 932; en 375 × 667 se ven las horas y sus iconos y asoma la temperatura; en 320 × 568, el encabezado y el comienzo de la fila.
  - **Orden:** fila 1, la zona en grande (el propio nombre abre el selector, sin píldora) y su estrella; fila 2, la hora («Ahora 11:06», o la hora elegida con «Volver a ahora»), y a la derecha Compartir y Ajustes juntos; luego la temperatura con el cielo en palabras y la máxima y mínima al lado, el instrumento de viento y el veredicto. La frase del veredicto se omite cuando solo repite el cielo y el viento (`verdict.plain`). Las horas van primero en la hoja (`order: -1`); el orden del DOM y del foco es el de escritorio.
  - **Favoritas:** el héroe no lleva selector propio. Se llega a ellas con el nombre de la zona, que abre el selector con «Tus zonas» arriba (cielo y temperatura de cada una). Además, deslizar la escena en horizontal (táctil o lápiz, nunca desde un control; `touch-action: pan-y` deja el desplazamiento vertical a la página) pasa a la favorita vecina; las palabras entran desde ese lado (260 ms, `--ease-out`; con menos movimiento, solo un fundido).
  - **Horizonte:** anclado abajo (`calc(100% − --sea-band)`, con `--sea-band` de `clamp(4,5rem, 10svh, 7rem)`: el mar es una franja, no media escena), con 2,5 rem de cielo libre (`--sky-gap`) entre el texto y el horizonte para lo que asoma sobre él: palmeras, el faro, el Gran Hotel, el borde del cráter.
  - **Sin saltos:** el veredicto reserva siempre dos líneas (`min-height: 2lh`, alineado abajo), así que cambiar de hora o de zona no mueve las horas que se están tocando. Comprobado en ocho zonas y ocho horas seguidas a 320, 375 y 390 px: 0 px.
  - **Pantallas bajas** (alto ≤ 46 rem): temperatura, veredicto y márgenes un punto más compactos.
- **Tableta (≥ 48 rem):** el mismo flujo con una medida de lectura más tranquila.
- **Escritorio (≥ 64 rem):** raíl lateral. Arriba, las cinco pestañas, con «Ayúdanos» la última; Ajustes, solo al pie. En ventanas muy bajas el raíl se desplaza en vez de cortar Ajustes. En Hoy, la escena es una banda panorámica (`clamp(28rem, 58vh, 34rem)` de alto) en un contenedor de 84 rem: zona, hora (tras un filete) y acciones en una línea; debajo, la temperatura con el cielo y, bajo ellos, el viento; a su derecha, tras otro filete, el veredicto y su frase; el cielo de la derecha queda para el sol y la luna. Debajo, «ahora» (viento, mar y marea en tres columnas desde 72 rem), las 24 horas a todo el ancho —justo bajo la escena que previsualizan— y una rejilla de dos columnas: planes y detalle a la izquierda, los siete días a la derecha. El orden del DOM y del foco es el de móvil. Zonas y Mar pasan a dos columnas a partir de 72 rem.
- **Horas:**
  - Más anchas que altas: 5,25 rem en móvil y 5,75 rem en escritorio. Arriba la hora a 0,9375 / 1 rem (con el día en verde al empezar uno nuevo); en una línea, el glifo (1,75 / 2 rem) y la temperatura; al pie, el viento.
  - **Viento:** una fila al pie de cada hora, de borde a borde dentro de su marco, con la flecha hacia donde sopla y «26 km/h», teñida con el color del viento (verde poco viento, naranja moderado, rojo fuerte). Recorrer la tira con la vista dice cómo cambia el viento. Leyenda: la escala de color y «Viento en km/h».
  - Ya no hay curva de temperatura: la cifra va junto al cielo y cada hora es un 30 % más baja.
  - El resaltado va hundido unos píxeles a cada lado, para que las horas vecinas respiren.
  - Cada hora lleva un borde de 1 px en `--c-accent-soft`, el mismo tono que el relleno de la elegida. La elegida conserva ese relleno y pasa a `--c-accent`: más oscuro de día y más luminoso de noche, siempre el verde más visible del tema.
- **Controles sobre la escena:** solo Compartir y Ajustes son botones redondos (`.sky-button`, `--sky-control-h` de 2,5 rem); la zona y la estrella son texto e icono sin píldora, con un fondo tenue al pasar el ratón. En escritorio comparten una fila y se centran en ella. Por debajo de 23 rem bajan a 2,25 rem, se acercan y la zona pierde el chevron y el alfiler, para que su nombre se lea entero. Con pantalla táctil (`pointer: coarse`) cada uno responde en 44 px gracias a un anillo invisible (`::after`, en porcentajes de su caja de relleno), sin parecer más grande; los `.chip`, igual en vertical, y los campos de texto llenan su píldora. Con pantalla táctil () cada uno responde en 44 px gracias a un anillo invisible (, en porcentajes de su caja de relleno), sin parecer más grande; lo mismo los , en vertical.
- **Hora actual:**
  - En Hoy va en la segunda fila (en escritorio, tras la zona y un filete), como texto sin píldora: «Ahora 14:36», o «En Lanzarote» si el reloj de quien visita marca otra hora.
  - Es la hora de lo que dibuja la escena: al previsualizar una hora muestra esa hora con su día («Hoy 18:00», «Mañana 05:00») y vuelve a la actual con «Volver a ahora». Cada cambio entra desde un leve desenfoque (240 ms, `--ease-out`).
  - En móviles estrechos muestra solo la hora.
  - En la marea, la marca de «ahora» baja del punto de la curva al eje, donde va la hora, y las horas del eje que taparía se apartan. Si la etiqueta de una bajamar profunda llegaría a la píldora (pasa en móvil, con la gráfica más baja), sube lo justo para dejarla libre, sin dejar de estar bajo su punto; mientras no se tocan, nada se mueve.
- **Mapa de Zonas:**
  - Los marcadores están donde están los lugares; solo se mueven las etiquetas (`LABEL_SIDE`): Órzola encima, Arrieta abajo a la derecha, Famara arriba a la izquierda (sobre el Risco) y Puerto del Carmen arriba a la izquierda. Comprobado midiendo en el navegador de 320 a 1440 px, con cada zona del norte elegida: ninguna etiqueta toca otra ni otro marcador, ni sale de la pantalla. El contorno no se toca.
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

- **Mar:** el titular lleva una marca de la marea (sube o baja). La curva va en un panel con un soplo del color del mar, sin sombra. La frase «Estimación del modelo oceánico…» sale de la gráfica: la estimación se dice en «Pleamares y bajamares (estimadas)», en el pie y en Legal. El mar de la zona: el estado en grande («Mar movido») y tres partes, palabras primero y cifras después: Oleaje («Olas de 1,5 m», «Cada 7 s», con un glifo de olas de su altura), Mar de fondo («Llega del norte», «Ondas largas, llegan de lejos · 1,1 m cada 12 s», con una flecha) y Agua («Templada», «23 °C»; bandas orientativas: fría < 19, fresca < 21, agradable < 23, templada). Tres columnas desde tableta. En escritorio la curva (15 rem de alto) y las pleamares y bajamares van lado a lado y a la misma altura, y el mar de la zona ocupa todo el ancho debajo (titular a la izquierda, las tres partes a la derecha), sin columnas que se queden solas. Las zonas más tranquilas, de menos a más olas, con una barra por zona (escala: la más alta, nunca menos de 2 m) y la zona elegida en verde; en escritorio, en dos columnas que se leen hacia abajo.
- **Dónde ir:** cabecera con el resumen de la isla y el aviso de que son orientativas; la primera idea ancha y las demás en una rejilla uniforme: una columna hasta 72 rem y dos columnas iguales en escritorio, con las tarjetas de cada fila a la misma altura.

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
