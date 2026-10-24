# LanzaMet

<https://lanzamet.com> · Hasta el 24-10-2026 se llamó «¿Qué tal hoy?»; en el código y en el almacenamiento del navegador, el prefijo pasó de `qth` a `lm` (las preferencias guardadas se migran solas).

Web para entender en tres segundos cómo está el día en Lanzarote: tiempo, viento, mar, mareas y a qué zona ir. Gratuita, sin publicidad ni suscripciones. En español y en inglés.

Desde la fase 2 muestra **datos reales**: previsión meteorológica y marítima de Open-Meteo y avisos oficiales de AEMET. Los datos simulados de la fase 1 solo existen en la build de demostración (`npm run start:demo`) y en los tests; la build de producción no los incluye.

## Ejecutar

Requisitos: Node 24+ (el API ejecuta TypeScript directamente) y npm.

```bash
npm install
npm run api          # API propio en http://localhost:8787/api (AEMET y copia compartida de
                     #   Open-Meteo; la clave de AEMET va en .dev.vars, ver más abajo)
npm start            # web en http://localhost:4200 (reenvía /api al API propio)
npm run start:demo   # web con datos simulados (escenarios, hora y red ajustables)

npm test             # tests unitarios de la web (Vitest)
npm run test:api     # tests del API (node:test, con ficheros reales de AEMET)
npm run typecheck:api
npm run verify:sources  # comprueba en vivo todas las fuentes para las 7 zonas
npm run lint
npm run build        # build de producción en dist/, sin clave de Web3Forms

npm run build:prod   # build para publicar: con la clave de Web3Forms (.env) y comprobaciones
npm run preview      # build:prod + el Worker de Cloudflare en local, en http://localhost:8788
npm run deploy       # build:prod + publicar en Cloudflare (ver DEPLOYMENT.md)
npm run deploy:check # build sin clave + simulacro de publicación; no publica nada
```

**Publicar y actualizar en Cloudflare: [`DEPLOYMENT.md`](DEPLOYMENT.md).**

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
| Famara | 29,116 / −13,557 | 29,120 / −13,604 ² | 29,208 / −13,708 | 18 km |
| La Santa | 29,112 / −13,655 | 29,120 / −13,604 ² | 29,125 / −13,792 | 13 km |
| Órzola | 29,223 / −13,450 | 29,218 / −13,469 | 29,292 / −13,458 | 8 km |
| El Golfo | 28,982 / −13,831 | 28,952 / −13,828 | 28,958 / −13,875 | 5 km |

¹ ² Zonas que comparten celda: el modelo no las distingue y muestran los mismos valores (salvo el ajuste de temperatura por altitud). No se inventan diferencias. En la fase 3 se retiró **Papagayo**, que repetía las celdas de Playa Blanca: quien la tuviera guardada pasa a Playa Blanca (`RETIRED_LOCATIONS`). **La Santa** se retiró entonces por lo mismo y ha vuelto: su tiempo es el de Famara, pero su mar se lee en una celda propia, al oeste de su bahía. La pantalla Mar indica a cuántos kilómetros está el punto de mar abierto y que en la orilla las olas pueden ser distintas.

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
- **Clave**: gratuita en <https://opendata.aemet.es/centrodedescargas/altaUsuario>. En local va en `.dev.vars` en la raíz del proyecto, una sola línea `AEMET_API_KEY=…`. Git ignora ese archivo y lo leen tanto `npm run api` como `npm run preview` (`wrangler dev`). `server/.dev.vars`, el sitio anterior, sigue valiendo para `npm run api`. En producción se guarda como secreto del Worker (`npx wrangler secret put AEMET_API_KEY`), nunca en el frontend. `http://localhost:8787/api/salud` dice si hay clave sin revelarla.

## Caché y actualización

> Consumo real por visitante, límites de los proveedores, capacidad estimada y recomendación a largo plazo: [`API_USAGE_AUDIT.md`](API_USAGE_AUDIT.md).

- **Una petición por fuente para toda la isla.** Open-Meteo admite listas de coordenadas: las 7 zonas cuestan 3 peticiones (tiempo, mar con 7 puntos distintos y polvo), por muchas pantallas que las usen. Las peticiones simultáneas se comparten (`ResponseCache`).
- **Caducidad según el modelo**: tiempo 30 min, mar 60 min, polvo 3 h, avisos 10 min, observaciones 20 min. Las respuestas de Open-Meteo se guardan en `localStorage`, así que recargar dentro de ese plazo no pide nada.
- **Actualización automática**: los stores se revisan cada 15 min (`ClockStore.refreshBeat`) y la caché decide si eso llega a la red. **Con la pestaña oculta ese pulso se detiene**: una pestaña olvidada no pide nada. Al volver a verla, se vuelve a pedir lo caducado. «Actualizar» vuelve a pedir lo que tenga más de 1 min, y al recuperar la conexión se piden los datos enseguida.
- **Copia compartida de Open-Meteo** (`/api/open-meteo/{forecast,marine,air-quality}`, `server/open-meteo.ts`):
  - La web pide al API propio la misma consulta que haría a Open-Meteo. El API la reenvía y guarda la respuesta, sin tocarla, 10 min (tiempo), 30 min (mar) o 60 min (polvo), para todos los visitantes. Esas caducidades son más cortas que las de la web para que, sumadas, la antigüedad máxima siga siendo de unos 40 min.
  - Open-Meteo recibe así unas pocas peticiones por hora, vengan los visitantes que vengan, y las ve llegar desde Cloudflare, como recomienda para Workers.
  - No es un proxy abierto: solo esos tres servicios, los parámetros que usa la web y coordenadas de Lanzarote.
  - **Reserva**: si el API no está, falla, devuelve algo inesperado o tarda más de 8 s, el navegador pregunta directamente a Open-Meteo, como antes.
  - El pie («Actualizado a las…») toma la hora en que la web recibió los datos, que puede ser hasta 10 min posterior a la de Open-Meteo.
- **API propio**: guarda cada respuesta en dos niveles (`server/edge-cache.ts`): en la memoria de cada instancia y en la Cache API de Cloudflare, compartida por las instancias de cada centro de datos (solo en el dominio propio; en `*.workers.dev` y en Node, solo memoria). Si AEMET o Open-Meteo fallan, sirve la copia anterior de hasta 2 h, marcada como antigua (`stale: true` o la cabecera `x-stale`). Solo atiende rutas fijas (`/api/avisos`, `/api/observaciones`, `/api/open-meteo/…`, `/api/salud`).
- Qué se ha hecho de la auditoría de consumo y qué no: [`API_USAGE_AUDIT.md`](API_USAGE_AUDIT.md#estado-24-10-2026).
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
- **Ayúdanos** (`/mejorar`): formulario para avisar de errores y proponer sugerencias o mejoras; el correo es opcional. Ver [Comentarios de los usuarios](#comentarios-de-los-usuarios).
- **Ajustes**: idioma, apariencia, **acceso rápido** (instalar la web como app o guardarla en marcadores; ver [Instalar la web](#instalar-la-web-pwa)) y un enlace a **Legal y privacidad**.
- **Legal y privacidad** (`/legal`, sin pestaña propia: se llega desde Ajustes): aviso de seguridad, privacidad (qué se guarda en el dispositivo, qué ven los servidores y qué envía el formulario de Ayúdanos), condiciones de uso, de dónde salen los datos con sus licencias y el estado de AEMET, y contacto.

## Comentarios de los usuarios

La sección **Ayúdanos** envía los mensajes por correo electrónico a través de [Web3Forms](https://web3forms.com), sin backend propio.

**Qué pide**: tipo (error, sugerencia, mejora u otro), mensaje (de 10 a 2000 caracteres) y un correo opcional, solo para poder responder. No hay registro ni otros datos personales.

**Qué se envía**: el tipo, el mensaje, el idioma de la web y, solo si se escribe, el correo (que pasa a ser la dirección de respuesta). Nunca la zona elegida, la URL, cookies ni el *referrer* (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`). Bajo el botón, una línea plegable («Cómo tratamos tus datos») explica qué se envía, que Web3Forms recibe datos de conexión como la IP, qué se guarda en el dispositivo y cómo pedir el borrado, con enlace a la política de Web3Forms.

**Solo hay «enviado» si Web3Forms lo confirma** (HTTP 200 con `success: true`). Cualquier otra respuesta se muestra como error y el mensaje se conserva: sin conexión, tiempo agotado (15 s), demasiadas peticiones (429), rechazo (4xx, p. ej. el filtro de spam) o fallo del servicio (5xx o respuesta sin confirmar).

**Antispam y envíos repetidos**:
- Web3Forms filtra el spam en su servidor en todos los envíos.
- Campo trampa (*honeypot*) oculto: si llega relleno, no se envía nada. Además se manda `botcheck: false`, el campo trampa de Web3Forms.
- En el dispositivo: un envío no sale antes de 3 s desde que se abre el formulario; tras cada envío hay 30 s de pausa; como mucho 5 por hora; y el mismo mensaje no se envía dos veces en 24 h. Solo se guardan las horas de envío y una huella FNV-1a del último mensaje, nunca su texto (`localStorage`, clave `lm.feedback`).
- Un segundo clic mientras se envía no duplica el envío.
- No se usa hCaptcha: obligaría a cargar un script de terceros que también recoge datos. Si un día llega spam, se puede activar en el panel de Web3Forms (es gratis) y añadir su widget al formulario.

**Límites de Web3Forms** (consultados el 23-10-2026): el plan gratuito permite 250 envíos al mes, formularios y dominios ilimitados, y hCaptcha. Restringir la clave a un dominio, reCAPTCHA/Turnstile, adjuntos y webhooks son de pago. Su API está pensada para llamarse desde el navegador: los envíos desde un servidor necesitan plan de pago y una IP autorizada, así que no se envía a través del API propio. En el plan gratuito, Web3Forms guarda una copia de los envíos durante 30 días.

### Configurar la clave de Web3Forms

1. Entra en [web3forms.com](https://web3forms.com), escribe el correo donde quieres recibir los mensajes y pulsa *Create Access Key*. La clave (un UUID) llega a ese correo. No hace falta cuenta ni tarjeta.
2. Ponla en un archivo `.env` en la raíz del proyecto (Git lo ignora), una línea `WEB3FORMS_ACCESS_KEY=tu-clave`. **No se escribe en el código.** `npm run build:prod` (y `npm run deploy`) la leen de ahí o del entorno y la pasan a Angular con `--define`, sin depender del shell. En Cloudflare, con despliegue desde Git, va en las variables de build ([`DEPLOYMENT.md`](DEPLOYMENT.md)). Para probarla con el servidor de desarrollo:

   ```bash
   npx ng serve --define "LM_WEB3FORMS_KEY='tu-clave-de-acceso'"
   ```
3. Sin clave, o con una que no tenga forma de UUID, la página avisa de que el envío aún no está activado y no envía nada. La build de demo usa el mismo servicio real: no hay envíos simulados.

La clave de Web3Forms **no es secreta**: según su documentación puede ser pública, porque solo sirve para enviar correos a la dirección que la creó, y acaba en el JavaScript que descarga el navegador. Se deja fuera del repositorio para no atar el código a un buzón concreto. Con el plan Pro se puede restringir a tu dominio.

**Cambiar de proveedor**: la interfaz solo habla con `FeedbackService`, y este con el puerto `FeedbackTransport` (`core/feedback`). Para usar otro servicio basta con escribir otra clase `FeedbackTransport` y enlazarla en `provideFeedback()`.

## Instalar la web (PWA)

LanzaMet se puede tener entre las apps del móvil o en el escritorio del ordenador sin pasar por ninguna tienda: es la misma web, instalada como aplicación web progresiva (PWA). No hay app nativa.

### Dónde está

- **Ajustes → Acceso rápido** es su sitio fijo, entre Apariencia y las fuentes de datos. Es una fila con el icono de la app, una frase y un botón:
  - **Instalar**, si el navegador permite hacerlo desde la web (Chrome, Edge, Samsung Internet y Opera, mediante `beforeinstallprompt`). Abre el diálogo del propio navegador.
  - **Ver cómo**, si el navegador lo hace desde su menú (Safari, Firefox para Android) o no lo hace (Firefox de escritorio). Abre una guía.
  - **Ya la tienes instalada**, con una marca verde, cuando consta que está instalada.
  - En un ordenador con instalación directa, «Ver otras formas» abre la guía, que compara la app con los marcadores.
  - Si la web ya se está ejecutando como app (`display-mode: standalone` o `navigator.standalone` en iOS), la sección no aparece.
- **Invitación contextual**: una tarjeta pequeña sobre la barra de pestañas en el móvil y en la esquina inferior derecha en el ordenador. Su política (`core/pwa/install-record.ts`):
  - nunca en la primera visita: espera al segundo día distinto con visita;
  - como mucho dos veces, con una semana entre una y otra;
  - nunca más si se cierra (la cruz, o Escape desde sus botones), si se usa o si la web ya está instalada;
  - aparece 8 s después de cargar, solo con la página visible y sin ninguna hoja abierta; no toma el foco;
  - solo donde se puede cumplir lo que promete: con el botón del navegador disponible, o en iPhone/iPad y Firefox para Android, donde los pasos son cortos y seguros. Nunca dentro del navegador de otra app (Instagram, Facebook…), que no puede añadir nada a la pantalla de inicio.
- **No está en la barra de navegación ni en Hoy**: es una acción que se hace una sola vez y no merece una pestaña ni espacio fijo en la pantalla principal.
- Al recibir la oferta de instalación, la web cancela el banner automático de Chrome (`preventDefault`), así que el navegador no insiste por su cuenta. Un script en línea de `index.html` guarda la oferta si llega antes de que arranque Angular.

### Qué dice en cada plataforma

La guía (`layout/install/install-guide`) se abre en el dispositivo detectado (`core/pwa/device.ts`, a partir del user agent; el iPad se reconoce porque se presenta como Mac con pantalla táctil). Unos botones permiten ver los pasos de otro dispositivo si la detección falla. Cada paso muestra el icono que hay que buscar en pantalla, dibujado como lo dibuja el navegador. No se promete nada que el navegador no haga.

| Dónde | Qué ofrece |
|---|---|
| Android con Chrome, Edge, Samsung Internet u Opera | Botón **Instalar** (diálogo del navegador). Si aún no hay oferta, los pasos del menú |
| Android, Samsung Internet sin oferta | Menú (tres rayas) → «Añadir página a» → «Pantalla de inicio» |
| Android, Firefox y otros | Menú (tres puntos) → «Instalar aplicación» o «Añadir a pantalla de inicio» |
| iPhone y iPad, Safari | «Safari no instala webs con un botón»: Compartir (si no se ve, primero el botón de los tres puntos) → «Añadir a pantalla de inicio» → «Añadir» |
| iPhone y iPad, Chrome, Edge o Firefox | Los mismos pasos, con Compartir en la barra de direcciones o en el menú |
| Navegador dentro de otra app | Que abra la página en Safari (o en su navegador) y la añada desde allí |
| Ordenador, Chrome, Edge u Opera | Botón **Instalar**; sin oferta, el icono de instalar de la barra de direcciones o su menú |
| Mac, Safari (Sonoma o posterior) | «Archivo» → «Añadir al Dock» |
| Ordenador, Firefox | Que Firefox no instala webs como app, y las alternativas |
| Todos los ordenadores | **En marcadores**: `Ctrl + D` (`Cmd + D` en Mac; las dos combinaciones si se mira desde un móvil) y cómo crear un acceso directo arrastrando el icono de la barra de direcciones. Nunca se añade un marcador automáticamente: no hay API estándar para ello |

En el ordenador la guía separa **Como app** («se abre en su propia ventana, con su icono, sin pestañas ni barra de direcciones») de **En marcadores** («se queda en tu navegador, junto a tus otras webs, a un clic»). Todo está en español y en inglés.

**Cuándo consta que está instalada**: al aceptar el diálogo del navegador, al recibir `appinstalled` o al abrirse en modo app. Se guarda en este dispositivo (`localStorage`, clave `lm.install`, junto al recuento de días con visita y de invitaciones; nada más). Desinstalar no deja rastro, así que, si el navegador vuelve a ofrecer la instalación, se olvida. En iOS no hay forma de saberlo desde Safari: la guía se sigue ofreciendo hasta que la web se abre como app.

### Manifest e iconos

- `public/manifest.webmanifest`: `id` y `start_url` `/`, `display: standalone`, nombre y nombre corto «LanzaMet» (el que se lee bajo el icono), fondo y color de tema `#f8fafb` (el fondo de día, el mismo de `<meta name="theme-color">`), idioma `es`.
- Iconos en `public/icons/`, sacados del logotipo (el sol poniéndose tras la montaña, sobre el mar). Los de la app llevan un fondo claro, un degradado de blanco a un azul muy pálido (`oklch(0.95 0.012 215)`), el mismo en la pantalla de inicio, en el ordenador y en la web:
  - `icon-192.png` e `icon-512.png` («any»), con las esquinas redondeadas (22,5 %) y transparentes fuera, y el dibujo al 80 % del ancho;
  - `icon-maskable-192.png` e `icon-maskable-512.png` («maskable»), a sangre, con el dibujo al 66 % del ancho, dentro de la zona segura del 80 %;
  - `apple-touch-icon.png` (180 px), a sangre y sin transparencia, porque iOS redondea él las esquinas;
  - `logo.png` (288 × 172, transparente, ceñido al dibujo): la marca dentro de la web (`BrandMark`) y en la tarjeta para compartir. En el raíl flota sobre la página de día; de noche, y en el icono de Acceso rápido (`tile`), va sobre la misma placa clara que el icono de la app, porque la montaña oscura se perdería en el fondo oscuro.
- `public/favicon.ico` (16, 32 y 48 px) e `icons/favicon-96.png`, para pantallas densas: el dibujo transparente, sin placa. `index.html` pide el `.ico` como `favicon.ico?v=2`: los navegadores guardan el favicon por su URL, y seguían con el de Angular.
- Todo sale del PNG original del logotipo (fondo negro). El negro se quitó convirtiéndolo en transparencia, con un umbral para el ruido de compresión y los bordes suavizados recuperando su color.
- `index.html` enlaza el manifest y el `apple-touch-icon`, y declara `apple-mobile-web-app-title` y la barra de estado de iOS por defecto. El color de la barra en modo app lo sigue llevando `ThemeStore`, como en el navegador: el cielo en Hoy y el fondo en las demás pantallas.
- El manifest va en español, el idioma por defecto: solo puede tener uno, y el nombre es el mismo en los dos.

### Service worker y datos frescos

El service worker es el de Angular (`@angular/service-worker`), configurado en `ngsw-config.json` y registrado solo en la build de producción (`provideAppServiceWorker()`), 30 s después de que la primera pantalla se asiente.

- **Guarda la app, nunca el tiempo.** Solo cachea el HTML, el JS, el CSS, las fuentes, los iconos y el manifest. No hay `dataGroups`: Open-Meteo, el API propio (`/api`) y Web3Forms van siempre a la red, y su caducidad sigue siendo la de `ResponseCache` (30 min el tiempo, 60 el mar…). Comprobado: la caché del service worker solo contiene archivos del propio origen.
- **Navegación con red primero** (`navigationRequestStrategy: freshness`): con conexión, cada visita carga el `index.html` recién desplegado. La copia guardada solo se usa sin red. Así nadie se queda con una versión antigua de la app.
- **Sin conexión**, una copia instalada abre igual y cada pantalla dice que no hay conexión con el servicio meteorológico, con «Reintentar». Nunca se muestran datos caducados como si fueran actuales.
- **Al volver la conexión** (`online`), los datos se piden otra vez sin esperar a la siguiente revisión de 15 min.
- Si el navegador expulsa parte de la caché y la versión guardada ya no se puede servir entera (`unrecoverable`), la página se recarga.
- **Tamaño**: unos 1,2 MB entre todo el JS, el CSS y las fuentes. El JS y el CSS se descargan al instalar el worker; las fuentes y los iconos, la primera vez que se usan.
- `/api/**` queda fuera de la navegación del worker, así que nunca devuelve el HTML de la app.

### Requisitos para que se pueda instalar en público

1. **HTTPS** en el dominio público. Los navegadores solo permiten service workers e instalación en un origen seguro; `localhost` es la única excepción, para desarrollo.
2. **La web en la raíz del dominio** (`/`). Para servirla en una subruta hay que cambiar `start_url`, `scope` e `id` del manifest, el `<base href>` y compilar con `--base-href`.
3. **Cabeceras**: `index.html`, `ngsw.json`, `ngsw-worker.js`, `safety-worker.js`, `install-prompt.js` y `manifest.webmanifest` sin caché larga (`Cache-Control: no-cache`), para que un despliegue nuevo llegue a las copias instaladas. El manifest con `Content-Type: application/manifest+json`. `public/_headers` ya lo hace en Cloudflare (Workers y Pages) y en Netlify; en otro hosting hay que configurarlo a mano.
4. **Rutas de la SPA**: cualquier ruta sin extensión (`/mar`, `/zonas`…) debe servir `index.html`. En el Worker lo hace `not_found_handling: "single-page-application"` (`wrangler.jsonc`); en Netlify hace falta una regla `/* /index.html 200`.
5. **Build de producción** (`npm run build:prod`): solo la build de producción incluye `ngsw-worker.js` y `ngsw.json`. `npm start` y la demo no registran service worker.

Todo esto queda resuelto con el despliegue en Cloudflare de [`DEPLOYMENT.md`](DEPLOYMENT.md). Probado en local con el runtime de Cloudflare: tras publicar una versión nueva, la primera recarga ya la carga, también en la copia controlada por el service worker. Si una página abierta antes del despliegue pide una pantalla diferida cuyo archivo ya no existe, se recarga una vez sola (`core/pwa/stale-version.ts`, con un freno para no entrar en bucle).
6. Chrome pide además unos segundos de uso real antes de ofrecer la instalación. Hasta entonces, la guía explica cómo hacerlo desde el menú.

Comprobarlo tras desplegar: Chrome DevTools → Application → Manifest (sin errores ni avisos de instalabilidad) y Service workers (activo, controlando la página). En Lighthouse, la categoría PWA ya no existe; los avisos de instalabilidad salen en el panel Application.

**Si hubiera que retirarlo**: quitar `provideAppServiceWorker()` y `serviceWorker` de `angular.json`, y publicar una vez `safety-worker.js` como `ngsw-worker.js`. Ese worker se desregistra solo y borra sus cachés en los dispositivos que lo tenían.

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
- **Hoy en el móvil** (por debajo de 64 rem; el escritorio no cambia):
  - La primera pantalla es la escena y, justo debajo, las 24 horas. La escena toma lo que deja la pantalla tras la barra inferior y las horas, y crece solo si su contenido lo necesita.
  - La zona va con su nombre entero junto a su estrella, y la hora a la derecha. Ajustes y Compartir bajan a la esquina inferior derecha, sobre el mar.
  - El veredicto reserva dos líneas, así que elegir otra hora o zona no mueve las horas que se están tocando.
  - Con pantalla táctil, los controles de la escena y los chips responden en 44 px sin cambiar de tamaño, y la barra inferior es opaca.
  - Detalle y medidas en [`docs/DESIGN.md`](docs/DESIGN.md#adaptación).
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
  core/feedback      comentarios: FeedbackService, puerto FeedbackTransport, Web3FormsTransport,
                     reglas antirrepetición (puras)
  core/pwa           instalación: InstallStore (oferta del navegador, modo app, invitación),
                     dispositivo y política de la invitación (puras), service worker
  data-providers.ts  proveedores reales; la build "demo" lo sustituye por data-providers.demo.ts
  mocks/             simulador + fuentes simuladas + controles de demo (solo build demo y tests)
  shared/            escena, iconos, hoja, aviso oficial, crédito de datos, recomendación,
                     arco del sol, scroll horizontal
  layout/            navegación, selector de zonas, selector de idioma, ajustes,
                     instalación (fila de Ajustes, guía e invitación; las dos últimas con carga diferida)
  features/          today · zones · sea · plans · feedback (rutas con carga diferida)
server/              API propio (Fetch estándar): avisos y observaciones de AEMET, copia compartida de
                     Open-Meteo (open-meteo.ts) y caché en dos niveles (edge-cache.ts), con tests
scripts/             verify-sources.ts: comprobación en vivo de todas las fuentes;
                     build-production.ts: build para publicar, con sus comprobaciones
wrangler.jsonc       el Worker de Cloudflare: la web como assets y /api/* con server/api.ts
```

## Despliegue

Paso a paso, con lo que hay que configurar a mano y cómo publicar actualizaciones: **[`DEPLOYMENT.md`](DEPLOYMENT.md)**. En resumen:

- **Un Worker de Cloudflare** sirve la web (los archivos de `dist/lanzamet/browser`) y el API (`/api/*`) en el mismo dominio, con HTTPS. `npm run deploy` compila, comprueba y publica.
- **Seguridad** (`public/_headers`): Content-Security-Policy con scripts solo del propio sitio. Por eso `index.html` no tiene scripts en línea: la captura de la oferta de instalación vive en `public/install-prompt.js` (con `defer`, para no retrasar el primer pintado) y el CSS crítico no se incrusta (`inlineCritical: false`). Además, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`.
- **Carga inicial**: la build de producción precarga los chunks iniciales (`index.preloadInitial` en `angular.json`; Angular lo apaga por defecto cuando hay service worker) y Hoy, la portada, va en el bundle inicial en vez de cargarse aparte, para que no haya una cadena de descargas antes del primer pintado. Por eso el aviso del bundle inicial está en 700 kB. En Lighthouse móvil (local, mediana de 3), de 75 a 81 y el LCP de 4,4 s a 3,5 s.
- **API**: `server/api.ts` exporta un manejador `fetch` estándar. Sirve como Cloudflare Worker, en Deno o en cualquier host Node con `node server/dev.ts` (puerto en `PORT`). Variables: `AEMET_API_KEY` (secreto) y `ALLOWED_ORIGIN` (vacío por defecto: solo su propia web, sin CORS; un origen o `*` para abrirlo).
- La web llama a `/api` en su mismo origen. Si el API vive en otro dominio, cambia `provideHttpDataSources({ proxyUrl: 'https://…/api' })` en `src/app/data-providers.ts` y pon ese origen en `ALLOWED_ORIGIN`.
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
- La instalación se ha comprobado en Chrome sin interfaz (manifest sin errores ni avisos de instalabilidad, service worker activo, oferta de instalación recibida) y simulando iPhone y Android. Falta instalarla en dispositivos reales: Android con Chrome y Samsung Internet, iPhone con Safari y un Mac con Safari.
- Safari no dice si la web está instalada: en un iPhone, la guía se sigue ofreciendo en el navegador aunque ya esté en la pantalla de inicio (no así dentro de la app).
- Los nombres de los menús de cada navegador cambian con sus versiones. La guía nombra lo estable («Compartir», «Añadir a pantalla de inicio», «Archivo › Añadir al Dock») y, para Chrome y Edge, la sección del menú.
- «Ayúdanos» necesita una clave de Web3Forms en el build. La entrega real a un buzón está pendiente de probar con una clave; los tests y la revisión en el navegador simulan las respuestas de Web3Forms. Las reglas antirrepetición viven en el navegador: frenan los clics repetidos y los scripts sencillos, no a quien borre su almacenamiento. Lo demás lo cubre el filtro de spam de Web3Forms.
