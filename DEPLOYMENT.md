# Despliegue en Cloudflare

Guía para publicar LanzaMet (<https://lanzamet.com>) y sus actualizaciones.

La web se llamó «¿Qué tal hoy?» hasta el 24-10-2026. Ese día se publicó en pruebas como Worker `que-tal-hoy` (`https://que-tal-hoy.que-tal-hoy.workers.dev`). Con el nombre nuevo, el Worker es `lanzamet`: el antiguo se borra cuando `lanzamet.com` funcione (ver el paso 5).

## Cómo queda montado

Un solo **Worker de Cloudflare** (`lanzamet`) sirve todo bajo un mismo dominio y con HTTPS:

- **La web**: la build de Angular (`dist/lanzamet/browser`) como *static assets*. Cualquier ruta que no sea un archivo (`/mar`, `/zonas`…) devuelve `index.html`. Servir archivos no ejecuta código ni cuenta como petición del Worker: es gratis e ilimitado.
- **El API propio**, en `/api/*`: `server/api.ts`, el mismo código que `npm run api`. Hace tres cosas:
  - avisos de AEMET (sin clave);
  - observaciones de AEMET (con la clave como secreto);
  - una copia compartida de Open-Meteo.
- **Cabeceras** (`public/_headers`):
  - Content-Security-Policy estricta: scripts solo del propio sitio;
  - `nosniff`, `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`;
  - `no-cache` en el HTML, el manifest y los archivos del service worker, para que cada despliegue llegue también a las copias instaladas.

| Archivo | Para qué |
|---|---|
| `wrangler.jsonc` | Configuración del Worker: nombre, assets, rutas que ejecutan el API, variables |
| `scripts/build-production.ts` | Build de producción con la clave de Web3Forms y comprobaciones previas al despliegue |
| `public/_headers` | Cabeceras de seguridad y de caché de los archivos |
| `ngsw-config.json` | Service worker de la PWA (guarda la app, nunca los datos) |
| `.nvmrc` | Node 24 (el build lo necesita para ejecutar TypeScript) |

### Variables y secretos

| Nombre | Dónde se pone | ¿Secreto? | Para qué |
|---|---|---|---|
| `AEMET_API_KEY` | Secreto del Worker (`npx wrangler secret put AEMET_API_KEY` o el panel) | **Sí**: nunca en el repositorio ni en la web | Observaciones de las estaciones («Medido») |
| `WEB3FORMS_ACCESS_KEY` | En la **build**: archivo `.env` local o variables de build de Cloudflare | No: Web3Forms la diseña pública (solo envía a tu buzón) y acaba en el JavaScript. Se deja fuera del repositorio para no atar el código a un buzón | Que «Ayúdanos» envíe los mensajes |
| `PUBLIC_URL` | En la build, opcional (`.env` o variables de build) | No | La dirección que llevan los enlaces al compartir, p. ej. `https://lanzamet.com`. Sin ella se comparte la dirección desde la que se abre la web |
| `ALLOWED_ORIGIN` | `wrangler.jsonc` → `vars` | No | Vacío: el API solo atiende a su propia web. Pon un origen solo si otra web debe llamarlo desde el navegador |

Git ignora `.env`, `.dev.vars` y `.wrangler/`.

## Lo que tienes que hacer tú (una sola vez)

### 1. Cuenta de Cloudflare

1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up>.
2. En el ordenador del proyecto, inicia sesión desde la carpeta del proyecto:

   ```bash
   npx wrangler login
   ```

   Se abre el navegador para autorizar a Wrangler. Comprueba que ha funcionado con `npx wrangler whoami`.

### 2. Clave de Web3Forms (para «Ayúdanos»)

1. Entra en <https://web3forms.com>, escribe el correo donde quieres recibir los mensajes y pulsa **Create Access Key**. La clave, un UUID, llega a ese correo. No hace falta cuenta ni tarjeta.
2. Crea en la raíz del proyecto un archivo **`.env`** (Git lo ignora):

   ```
   WEB3FORMS_ACCESS_KEY=pega-aquí-tu-clave
   # Opcional, cuando tengas dominio:
   # PUBLIC_URL=https://tu-dominio.es
   ```

Sin esa clave, `npm run deploy` se niega a publicar: así no puede salir una versión con «Ayúdanos» desactivado por descuido.

Plan gratuito de Web3Forms: 250 envíos al mes. Guardan copia de los envíos 30 días. Su página de precios no se pudo consultar de forma automática; revísala tú antes de publicar.

### 3. Primer despliegue

```bash
npm install
npm run deploy
```

`npm run deploy` compila la web con tu clave, comprueba la build y la sube. Las comprobaciones son:

- están el service worker, las cabeceras y el manifest;
- `index.html` no tiene scripts en línea;
- no hay código de la demo;
- la clave está dentro de la build.

Al terminar, Wrangler muestra la dirección `https://lanzamet.<tu-subdominio>.workers.dev`.

### 4. Clave de AEMET como secreto

```bash
npx wrangler secret put AEMET_API_KEY
```

Pega la clave cuando la pida: es la misma de `server/.dev.vars`. Esto solo funciona en una terminal interactiva. Si no te deja teclearla, usa el comando con tubería del paso 5.4, que la lee del archivo. Se aplica al momento, sin volver a desplegar. Compruébalo en `https://lanzamet.com/api/salud`: debe decir `"aemetKey": true`, sin mostrar la clave.

### 5. El dominio, lanzamet.com

El dominio ya está declarado en `wrangler.jsonc` (`routes`, con `custom_domain: true`). Cada `npm run deploy` crea o confirma su registro DNS y su certificado HTTPS: no hay que tocar el DNS a mano.

1. **El dominio tiene que estar en la misma cuenta de Cloudflare.** En el panel, en **Account home**, `lanzamet.com` debe aparecer como **Active**.
   - Si lo compraste en Cloudflare (Domain Registration), ya lo está.
   - Si lo compraste en otro registrador: en el panel, **Add a domain** → `lanzamet.com` → plan **Free**. Después cambia en tu registrador los *nameservers* por los dos que te indique Cloudflare. Puede tardar de minutos a unas horas en quedar activo.
   - Si ya tiene registros DNS para `lanzamet.com` (algunos registradores crean una página de aparcamiento), bórralos en **DNS → Records**: el despliegue no puede crear el suyo encima de otro.
2. En `.env`, `PUBLIC_URL=https://lanzamet.com`, para que los enlaces al compartir lleven siempre el dominio.
3. Despliega: `npm run deploy`. Al terminar, Wrangler muestra `lanzamet.com (custom domain)`. El certificado tarda unos minutos la primera vez.
4. Guarda otra vez el secreto de AEMET, ahora en el Worker `lanzamet`. Los secretos son de cada Worker, y el nombre ha cambiado:

   ```bash
   node -e "process.stdout.write(require('fs').readFileSync('server/.dev.vars','utf8').match(/^AEMET_API_KEY=(.*)$/m)[1].trim())" | npx wrangler secret put AEMET_API_KEY
   ```

   Ese comando lee la clave de `server/.dev.vars` y se la pasa a Wrangler sin mostrarla. Un `npx wrangler secret put` sin tubería pide teclearla, y solo funciona en una terminal interactiva: en otras guarda un valor vacío.
5. **SSL/TLS → Edge Certificates**: activa **Always Use HTTPS**. HSTS es opcional; actívalo solo cuando el dominio vaya a servirse siempre por HTTPS.
6. `www.lanzamet.com` redirige a `lanzamet.com` (hecho el 24-10-2026). Hay un registro DNS `www`, de tipo `AAAA` con valor `100::` y proxy activado, para que Cloudflare atienda esas peticiones. La regla está en **Rules → Redirect Rules**, «www → lanzamet.com»: *wildcard* `https://www.lanzamet.com/*` → `https://lanzamet.com/${1}`, con código 301 y conservando la consulta.
7. Cuando `https://lanzamet.com` funcione, borra el Worker antiguo: **Workers & Pages → que-tal-hoy → Settings → Delete**. Si quieres que solo funcione el dominio, pon también `"workers_dev": false` en `wrangler.jsonc` y despliega.

La copia compartida de Open-Meteo usa la Cache API de Cloudflare, que **solo funciona en el dominio propio**. En `*.workers.dev` cada instancia del Worker guarda su propia copia en memoria: funciona igual, pero se ahorran menos peticiones.

### 6. Comprobar que todo funciona

En el dominio publicado:

- [ ] Hoy, Zonas, Mar, Dónde ir y Ayúdanos cargan. Recargar en `/mar` también funciona.
- [ ] `/api/salud` → `"ok": true, "aemetKey": true`.
- [ ] En Ajustes, «Avisos oficiales: Conectado» y «Medidas de estaciones: Conectado».
- [ ] **Ayúdanos**: envía un mensaje de prueba, uno sin correo y otro con correo, y comprueba que llegan a tu buzón (mira también en spam). La web solo dice «Recibido» si Web3Forms lo confirma.
- [ ] Compartir el tiempo, en un móvil: se abre el menú del sistema con la imagen.
- [ ] Instalar: Chrome → DevTools → Application → Manifest sin errores y Service workers «activated». En Android aparece «Instalar»; en iPhone, Compartir → Añadir a pantalla de inicio.
- [ ] DevTools → Console sin errores ni avisos de Content-Security-Policy.

## Publicar una actualización

```bash
npm test && npm run test:api && npm run lint   # que todo siga en verde
npm run deploy                                 # build comprobada + subida
```

Qué pasa después:

- Quien abra o recargue la web recibe la versión nueva. El HTML se pide siempre a la red y el service worker se actualiza solo.
- Una copia instalada (PWA) carga la versión nueva la próxima vez que se abra con conexión. Sin conexión, abre la última que tenía.
- Si alguien tenía la web abierta durante el despliegue y entra en una pantalla que aún no había cargado, la página se recarga una vez sola para traer la versión nueva (`core/pwa/stale-version.ts`).

**Volver atrás**: `npx wrangler rollback` (pide confirmación) o, en el panel, **Workers & Pages → lanzamet → Deployments**. La web y el API vuelven juntos a la versión anterior.

**Ver qué pasa en producción**: `npx wrangler deployments list` (despliegues) y `npx wrangler tail` (registro en vivo del API). Los registros también se ven en el panel (Observability).

### Desplegar desde Git (opcional)

Para que cada `git push` publique solo: **Workers & Pages → lanzamet → Settings → Builds → Connect** a tu repositorio de GitHub o GitLab y configura:

| Campo | Valor |
|---|---|
| Build command | `npm run build:prod` |
| Deploy command | `npx wrangler deploy` |
| Variables de build | `WEB3FORMS_ACCESS_KEY` y, si quieres, `PUBLIC_URL` |
| Rama de producción | `main` |

El secreto `AEMET_API_KEY` es del Worker, no de la build: no se repite aquí. Cloudflare lee la versión de Node de `.nvmrc`.

## Probar en local lo mismo que se publica

```bash
npm run preview    # build de producción + Worker local en http://localhost:8788
```

Es el mismo Worker con el runtime de Cloudflare (`workerd`): web, API, cabeceras, service worker y Cache API. Para que haya observaciones de AEMET, copia `server/.dev.vars` a la raíz como `.dev.vars` (Git lo ignora). `npm run api` también lo lee.

- Tras cambiar el código, vuelve a lanzar `npm run preview`. Con la vista previa en marcha, Wrangler no detecta los archivos nuevos con hash de una build posterior y sirve la página en su lugar.
- Si `npm run preview` dice que el puerto está ocupado, cierra la vista previa anterior: a veces su proceso `workerd` sigue vivo.

`npm run deploy:check` hace la build sin clave y un *dry run* de Wrangler: comprueba que todo se empaqueta, sin publicar nada.

## Consumo y límites (plan gratuito)

- **Worker**: 100 000 peticiones al día. Solo cuentan las del API, nunca los archivos de la web.
  - Cada visita nueva hace como mucho 5: tiempo, mar y polvo de la copia compartida, avisos y observaciones.
  - Recargar dentro de la caché no hace ninguna, y una pestaña oculta no pide nada.
  - Si algún día se superara el límite, la web pediría el tiempo directamente a Open-Meteo (la reserva) y solo faltarían los datos de AEMET.
- **Open-Meteo**: con la copia compartida recibe como mucho unas pocas peticiones por hora y centro de datos de Cloudflare, vengan los visitantes que vengan, en lugar de 3 por visitante. Si el API falla o tarda más de 8 s, cada navegador pregunta directamente a Open-Meteo, como antes.
- **AEMET**: avisos cada 10 min y estaciones cada 20 min, compartidos. Si AEMET falla, se sirve la última copia de hasta 2 h, marcada como antigua.

## Seguridad

- La clave de AEMET solo vive en Cloudflare como secreto y en tu `.dev.vars` local. `/api/salud` dice si existe, sin revelarla.
- El API solo responde a rutas fijas. La copia de Open-Meteo solo admite los tres servicios, los parámetros que usa la web y coordenadas de Lanzarote: no es un proxy abierto.
- Sin CORS por defecto: otras webs no pueden usar el API desde el navegador de sus visitantes.
- Content-Security-Policy: scripts solo del propio dominio; conexiones solo al propio sitio, a Open-Meteo y a Web3Forms; sin `iframe` de terceros (`frame-ancestors 'none'`).
- `npm audit`: 0 vulnerabilidades en lo que se publica. Las que señala están en herramientas de desarrollo (Vite dentro de `@angular/build` y `undici` dentro del simulador local de Wrangler) y desaparecerán al actualizarlas.

## Problemas frecuentes

| Síntoma | Causa y arreglo |
|---|---|
| «Ayúdanos» dice que el envío aún no está activado | La build se hizo sin `WEB3FORMS_ACCESS_KEY`. Revisa `.env` (o las variables de build) y despliega otra vez |
| «Ayúdanos» dice «No se ha enviado» | Web3Forms no lo confirmó: clave mal copiada, límite mensual o su filtro antispam. Mira la respuesta en DevTools → Network → `submit` |
| Observaciones «Pendiente de credenciales de AEMET» | Falta el secreto: `npx wrangler secret put AEMET_API_KEY` |
| Sigo viendo la versión anterior | Recarga una vez; en una app instalada, ciérrala y ábrela. Si persiste, comprueba en DevTools → Network que `index.html` y `ngsw.json` llegan con `Cache-Control: no-cache` |
| La consola avisa de Content-Security-Policy | Algo nuevo carga desde otro dominio o con un script en línea. Añade ese dominio a `connect-src` en `public/_headers`, o pásalo a un archivo |
| `npm run deploy` falla con «Falta WEB3FORMS_ACCESS_KEY» | Es a propósito: crea el `.env` del paso 2 |
