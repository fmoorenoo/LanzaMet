# ¿Qué tal hoy?

Prototipo frontend (fase 1) para entender en tres segundos cómo está el día en Lanzarote: tiempo, viento, mar, mareas y a qué zona ir.
**Todos los datos son ficticios** y se generan en el navegador. No hay backend ni llamadas a APIs.

## Ejecutar

Requisitos: Node 22.22+ o 24.15+ (probado con 24.21) y npm.

```bash
npm install
npm start          # http://localhost:4200
npm test           # pruebas unitarias (Vitest)
npm run lint       # ESLint + reglas de accesibilidad de plantillas
npm run format     # Prettier (format:check para verificar sin escribir)
npm run build      # build de producción en dist/
```

Estados de demo por URL: `/?escenario=calima` (`alisio`, `calma`, `ventoso`, `calima`, `borrasca`), `/?lento` (carga lenta), `/?fallo` (error de servicio). El panel **Ajustes y demo** permite además fijar la hora (amanecer, mediodía, atardecer, noche) y el tema.

## Pantallas

- **Hoy**: escena atmosférica generada a partir de los datos (cielo según hora y nubosidad, calima, lluvia, sol/luna, horizonte propio de cada zona, olas según el estado del mar y nivel del agua según la marea), veredicto en lenguaje natural, viento/mar/marea, línea de 24 h (tocar una hora previsualiza toda la escena; flechas del teclado), dónde ir, detalles y próximos 7 días.
- **Zonas**: mapa ilustrado de Lanzarote y La Graciosa con estado por zona y flujo del viento, más tarjetas con miniescena.
- **Mar**: marea subiendo/bajando, curva del día animada, pleamares y bajamares de hoy y mañana, estado del mar y zonas más tranquilas.
- **Dónde ir**: recomendaciones derivadas de los datos (playa, sin viento, mar tranquilo, atardecer, paseo, olas).
- Selector de zonas (hoja inferior arrastrable), favoritas persistidas en `localStorage`, modo día/noche según el sol de la zona.

## Arquitectura

```
src/app/
  core/models        contratos tipados (ubicación, tiempo, mar, mareas, recomendaciones)
  core/data          puertos de datos: LocationSource, WeatherSource, MarineSource
  core/insights      reglas puras: datos → lenguaje natural y recomendaciones (con tests)
  core/state         stores con Signals y rxResource (carga, error, vacío, refresco)
  core/utils         hora de Canarias, color OKLCH, almacenamiento seguro
  mocks/             simulador determinista + implementaciones mock de los puertos
  shared/            escena, iconos SVG propios, hoja, glifos, recomendación
  layout/            navegación, selector de zonas, panel demo
  features/          today · zones · sea · plans (rutas con carga diferida)
styles/              tokens, base, tipografía, controles, sistema de movimiento
```

### Integrar APIs reales (fase 2)

1. Implementar `WeatherSource`, `MarineSource` y `LocationSource` (`core/data/data-sources.ts`) con `HttpClient`, mapeando cada DTO a los modelos de `core/models`.
2. Sustituir `provideMockDataSources()` en `app.config.ts` por un `provideHttpDataSources()`.
3. Los componentes no cambian. `MarineSource` devuelve `null` si una zona no tiene cobertura; el modelo `Location.coverage` declara si hay mareógrafo, puerto de referencia o nada.
4. `IslandStore` pide la previsión de cada zona por separado; un backend propio podría servirla en una sola llamada.

## Diseño

Sistema completo documentado en [`docs/DESIGN.md`](docs/DESIGN.md). Tokens en `src/styles/_tokens.scss`: paleta de la isla (cal, picón, verde Manrique, ocre Timanfaya, Atlántico) en OKLCH con tema nocturno propio; tipografía única Bricolage Grotesque variable (auto-alojada); escala de 4 px; radios amplios; curvas `--ease-out`, `--ease-in-out`, `--ease-drawer`; duraciones de 140 ms a 1,4 s. Movimiento solo en `transform`/`opacity` salvo los colores del cielo (`@property`); todo respeta `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast`.

## Propuestas para la fase 2

1. **Datos reales** detrás de los puertos actuales: un proveedor meteorológico y marino (previsión horaria y diaria, oleaje y temperatura del agua), las predicciones de marea de un servicio portuario oficial (por ejemplo, Puertos del Estado para Arrecife) y la salida y puesta del sol del propio proveedor.
2. **Backend ligero (BFF)** que agregue las 9 zonas en una sola respuesta, guarde en caché por hora y calcule las recomendaciones en el servidor (el contrato `Recommendation` ya está separado de la interfaz).
3. **PWA**: instalación, funcionamiento sin conexión con los últimos datos y actualización en segundo plano.
4. **Avisos opcionales**: viento fuerte, mar de fondo, calima o pleamar en tus zonas favoritas.
5. **Más zonas y capas**: La Graciosa, Caleta de Famara o Charco del Palo, y una capa de oleaje y viento por costa en el mapa.
6. **Pruebas end-to-end** (Playwright) de los flujos principales y revisión en iOS y Android reales; regresión visual de la escena por escenario y hora.

## Limitaciones conocidas

- Datos simulados; el contorno del mapa y las mareas son aproximados y no sirven para navegación.
- Verificado en Chrome headless (móvil 360/390 px y escritorio 1440 px); falta prueba en dispositivos reales (Safari iOS: la transición CSS de `d` no está soportada y cae a cambio instantáneo).
- En mapas estrechos (móvil) los marcadores muestran cielo y temperatura sin nombre; la zona elegida se nombra en la tarjeta inferior.
- La curva de temperatura de la línea horaria está alineada en px: con un tamaño de letra raíz distinto del predeterminado puede desplazarse ligeramente respecto a las etiquetas.
