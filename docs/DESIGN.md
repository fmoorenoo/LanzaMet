# Sistema de diseño — ¿Qué tal hoy?

Documentado a partir de lo construido. La fuente de verdad son los tokens de `src/styles/_tokens.scss`; este documento explica sus papeles y las reglas de uso.

## Dirección

**La escena es el dato.** La pantalla principal no muestra un fondo decorativo: dibuja el día a partir de la previsión. El cielo depende de la hora y del sol de la zona; las nubes, la calima y la lluvia, de las condiciones; la velocidad de las nubes, del viento; la amplitud de las olas, del estado del mar, y el nivel del agua sobre la orilla, de la marea. Cada zona tiene su horizonte: La Graciosa desde el norte, el Risco sobre Famara, Fuerteventura desde el sur o los volcanes de Timanfaya.

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
- Sombras siempre con desplazamiento y difuminado (`--shadow-1`, `-2`, `-sheet`). Material translúcido solo en el cromo flotante (barra inferior), con alternativa para `prefers-reduced-transparency`.

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
- Los bucles ambientales (nubes, olas) usan WAAPI con `updatePlaybackRate`, así un cambio de viento no produce saltos. Se pausan fuera de pantalla y en pestañas ocultas.
- Con `prefers-reduced-motion` se conservan los fundidos de color y opacidad; desaparecen los desplazamientos y los bucles.
- Hover solo con `(hover: hover) and (pointer: fine)`.

## Componentes

| Componente | Archivo | Notas |
|---|---|---|
| Escena | `shared/scene` | `full` (animada) / `mini` (tarjetas); oculta a lectores de pantalla |
| Hoja | `shared/ui/sheet` | `<dialog>` nativo, inferior en móvil y centrada en escritorio |
| Icono | `shared/ui/icon` | Conjunto propio en rejilla de 24, trazo 1,75 |
| Glifo del cielo | `shared/ui/sky-glyph` | Bicolor: sol cálido, luna pálida, nubes que los tapan |
| Mensaje de estado | `shared/ui/status-message` | Vacío (`status`) / error (`alert`) con acción de recuperación |
| Recomendación | `shared/plans/plan-item` | Fila, o "lead" con miniescena |
| Controles | `styles/_controls.scss` | `.btn`, `.icon-btn`, `.chip`, `.choice`, `.field`, `.skeleton`, `.pendable` |

Cada sección contempla carga (esqueleto con la forma del contenido), datos, vacío (sin cobertura: se explica y se ofrece la alternativa más cercana), error (con Reintentar) y actualización (los datos anteriores siguen visibles, atenuados, mientras llegan los nuevos).

## Adaptación

- **Móvil (base):** escena casi a pantalla completa con la hoja de detalle superpuesta; barra de pestañas inferior con zonas seguras. El horizonte baja en pantallas de poca altura para que el texto siempre quede sobre cielo profundo.
- **Tableta (≥ 48 rem):** el mismo flujo con una medida de lectura más tranquila.
- **Escritorio (≥ 64 rem):** raíl lateral; la escena queda fija a la izquierda y el detalle se desplaza a la derecha. Zonas y Mar pasan a dos columnas a partir de 72 rem.

## Voz

Español de la isla, breve y concreto: "Mar como un plato", "Llueve, cosa rara", "El viento se está levantando". Las alturas se dan en palabras de playa ("Olas de unos 40 cm"). Cada dato dice de dónde sale: la previsión lleva su fuente y la hora de consulta en el pie de cada página; una estimación se dice como tal ("Bajamar hacia las 17:30", "Pleamares y bajamares (estimadas)"); una medida lleva su estación y su hora; un aviso oficial, su emisor. En la build de demo, los datos ficticios se declaran como tales.
