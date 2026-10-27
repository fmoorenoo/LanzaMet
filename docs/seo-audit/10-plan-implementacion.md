# 10 · Plan de implementación

Ordenado por impacto y dependencias. Las tareas (B-xx) están detalladas en `14-backlog-seo.md`. Los esfuerzos son estimaciones de desarrollo para una persona que conoce el proyecto; no incluyen redacción de textos ni revisión de diseño.

## 1. Criterios de priorización

| Prioridad | Significado |
|---|---|
| **P0** | Error crítico **comprobado** que impide o falsea la indexación |
| **P1** | Mejora de alto impacto con evidencia sólida |
| **P2** | Optimización y crecimiento |
| **P3** | Experimental o dependiente de decisiones de producto |

## 2. Matriz de priorización

Escala 1-5 (5 = más). Riesgo: 5 = más arriesgado.

| Tarea | Impacto | Evidencia/confianza | Potencial de tráfico | Esfuerzo | Riesgo | Valor para el usuario | Prioridad |
|---|---|---|---|---|---|---|---|
| B-01a Español por defecto en la URL | 5 | 4 (verificado en headless; falta Search Console) | 5 | 1 | 2 (cambia la primera vista de visitantes con navegador en inglés) | 2 | **P0** |
| B-02 robots.txt + sitemap | 3 | 5 | 2 | 1 | 1 | 1 | **P0** |
| B-03 404 real | 3 | 5 | 1 | 1-2 | 1 | 3 | **P0** |
| B-04 Cerrar workers.dev | 2 | 5 | 1 | 1 | 1 | 1 | **P0** |
| B-05 Canonical | 3 | 5 | 2 | 1 | 1 | 1 | **P0** |
| B-06 Search Console + Bing | 4 (habilita medir) | 5 | — | 1 | 1 | 1 | **P0** |
| B-07 Titles, descriptions, H1 | 4 | 4 | 4 | 2 | 2 (H1 visible: diseño) | 3 | P1 |
| B-10 Prerender (SSG) | 5 | 4 | 4 | 4-5 | 3 (hidratación, SW) | 4 (LCP) | P1 |
| B-11 URLs por zona | 5 | 4 (patrón de todos los competidores) | 5 | 4 | 2 | 4 (enlaces compartibles por zona) | P1 |
| B-12 `/viento` | 4 | 4 | 4 | 3 | 1 | 4 | P1 |
| B-13 `/sobre` + identidad | 3 | 3 | 1 | 1 | 1 | 3 | P1 |
| B-08 OG y compartir por zona | 3 | 4 | 2 | 1 | 1 | 3 | P1 |
| B-09 JSON-LD | 2 | 3 | 1 | 1 | 1 | 1 | P1 |
| B-14 Caché inmutable | 2 | 5 | 1 | 1 | 2 (reglas mal puestas podrían cachear el SW) | 3 | P1 |
| B-15 Enlazado interno | 3 | 4 | 3 | 2 | 1 | 3 | P1 |
| B-16 `/calima` | 3 | 4 (SERP de nicho) | 3 (picos) | 2-3 | 2 (YMYL) | 4 | P2 |
| B-17 `/avisos` | 3 | 3 | 3 (picos) | 2-3 | 2 | 4 | P2 |
| B-18 `/en/` | 5 | 4 | 5 | 4 | 3 | 4 | P2 |
| B-19 Clima mensual | 4 | 3 | 4 (EN) | 4 | 3 (datos) | 3 | P2 |
| B-20 Guías | 3 | 3 | 3 | 2 | 1 | 3 | P2 |
| B-21/22 Agua y estrecho | 2 | 3 | 2 | 1 | 1 | 3 | P2 |
| B-23/24 DOM y rendimiento | 2 | 4 | 1 | 3 | 2 | 3 | P2 |
| B-28 Alemán | 3 | 2 | 3 | 4 | 3 | 3 | P3 |
| B-29 Dato del día en el borde | 2 | 2 | 2 | 3 | 3 | 2 | P3 |

## 3. Fases

### Fase 0 · Esta semana: errores críticos y medición (≈ 2-3 días)

1. **B-06** Search Console + Bing. **Primero**, para tener una línea base y confirmar T-01 con la Inspección de URL. ✅ Completada el 27-10-2026: Search Console verificado, sitemap enviado e inspección de las 4 URL (confirmó T-01 y destapó el bloqueo de `/api/`, ya corregido). Bing importado desde Search Console, con sitemap y las 4 URL enviadas.
2. **B-01a** Español por defecto. ✅ Completada y publicada el 27-10-2026.
3. **B-02** robots.txt + sitemap (4 URL + legal). ✅ Completada y publicada el 27-10-2026.
4. **B-04** Cerrar `workers.dev`. ✅ Completada y publicada el 27-10-2026.
5. **B-05** Canonical por JS (provisional). ✅ Completada y publicada el 27-10-2026.
6. **B-03** 404 provisional con `noindex`. ✅ Completada y publicada el 27-10-2026.
7. **B-14** Caché inmutable. ✅ Completada y publicada el 27-10-2026.

**Hecho cuando**: Search Console verificado, sitemap aceptado, `/` renderizado en español en la Inspección de URL, URL inventada con `noindex`, sin host duplicado.

### Fase 1 · Semanas 2-5: base indexable (≈ 3-4 semanas)

Orden recomendado (cada paso se publica por separado):

1. **B-07** Titles, descriptions y H1 (con validación de diseño). ✅ Completada el 27-10-2026 (publicada).
2. **B-13** `/sobre`. ✅ Completada el 27-10-2026 (publicada).
3. **B-10** Prerender (SSG). Es la pieza grande. Hacerla **antes** de multiplicar URLs, para que las nuevas nazcan prerenderizadas. Incluye el 404 definitivo. ✅ Completada y publicada el 27-10-2026, sin hidratación (ver B-10 en el backlog).
4. **B-09** JSON-LD y **B-08** Open Graph en el HTML prerenderizado. ✅ Completada el 27-10-2026 (publicada).
5. **B-11** URLs por zona (18) + sitemap generado. ✅ Completada el 27-10-2026 (publicada).
6. **B-12** `/viento`.
7. **B-15** Enlazado interno. 🟨 En parte, con B-11.

**Hecho cuando**: las ~27 URL en español sirven HTML con su contenido estable, metadatos y JSON-LD; Lighthouse SEO 100 y accesibilidad 100; la experiencia de usuario es la misma de hoy.

### Fase 2 · Meses 2-3: crecimiento

1. **B-18** Inglés en `/en/` (el mercado más grande después del español).
2. **B-16** `/calima` y **B-17** `/avisos`.
3. **B-21**, **B-22**: agua y estrecho.
4. **B-20** Guías.
5. **B-19** Clima mensual (si la fuente de datos está verificada).
6. **B-23**, **B-24**: rendimiento y DOM.
7. **B-25** IndexNow; **B-27** enlaces y menciones.

### Fase 3 · Desde el mes 4: con datos de Search Console

- Revisar consultas y páginas: ¿hay que separar `/mareas` de `/mar`? ¿Qué zonas reciben impresiones? ¿La Graciosa como zona n.º 10?
- **B-28** Alemán parcial, si EN rinde.
- **B-29**, **B-31**, **B-35**: según decisión.

## 4. Dependencias

```
B-06 ─┐
B-01a ─┼─► B-07 ─► B-10 ─┬─► B-09, B-08 (en HTML)
B-02 ──┘                 ├─► B-11 ─► B-15 ─► B-18 ─► B-28
B-05 ─────────────────────┘          │
B-03 (provisional) ─► B-03 (404 real, con B-10)
B-12, B-16, B-17, B-19, B-20 ◄── B-10 (recomendado)
```

## 5. Contradicciones y cómo se resuelven

| Tensión | Resolución |
|---|---|
| «No cambiar el diseño» frente a «H1 estable y visible» | El veredicto mantiene su estilo como `<p>`; el H1 ocupa la línea pequeña existente. Validar antes de publicar; alternativa: H1 `visually-hidden` (menos señal) |
| «No cambiar la navegación» frente a «URLs por zona» | El menú no cambia. El selector, las tarjetas y el mapa siguen igual, pero son enlaces. La zona se sigue recordando |
| Privacidad («sin analítica») frente a medir el SEO | Search Console y Bing no añaden nada a la web. La analítica de servidor de Cloudflare no usa scripts. RUM propio solo si se cambia Legal (B-35) |
| Idioma automático (comodidad) frente a indexación | URL por idioma y sugerencia sin redirección. Mientras no exista `/en/`, B-01a hace que un turista vea primero español con un botón para cambiar |
| Marea estimada frente a «tabla de mareas» | No se esconde: se explica. Title sin «oficial». Guía de metodología |
| Prerender estático frente a datos del día en el HTML | El HTML lleva solo contenido estable; el dato vivo, en el navegador. El dato en el HTML queda para la fase 3 (B-29) |
| CSP estricta frente a JSON-LD en línea | `application/ld+json` no se ejecuta; solo hay que ajustar la comprobación del build |

## 6. KPIs y cómo medirlos

| KPI | Fuente | Línea base | Objetivo de proceso (no de ranking) |
|---|---|---|---|
| Páginas indexadas válidas | Search Console → Páginas | Desconocida (B-06) | Todas las del sitemap indexadas en 8 semanas tras publicarlas |
| Idioma de la versión indexada | Inspección de URL | Probablemente EN (inferencia) | ES en `/`, EN en `/en/` |
| Impresiones y clics no de marca | Search Console (filtro de marca) | 0 / desconocida | Tendencia creciente mes a mes |
| Consultas por cluster (tiempo, mareas, viento, calima, zona) | Search Console, filtros por regex | — | Presencia en los 6 clusters |
| CTR por página | Search Console | — | Comparar antes/después de B-07 |
| Posición media en consultas de zona y de nicho | Search Console | — | Seguimiento, sin objetivo prometido |
| Core Web Vitals (campo) | Search Console / CrUX | Sin datos | LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 en móvil |
| Lighthouse (laboratorio) | Lighthouse | Perf. móvil 65-73, SEO 91, accesibilidad 100 | SEO 100, accesibilidad 100, LCP móvil ≤ 2,5 s |
| Dominios que enlazan | Search Console → Enlaces | — | Menciones locales (ver `12`) |
| Errores de rastreo / soft 404 | Search Console | — | 0 |

Revisión: mensual, con una nota en `docs/seo-audit/` (archivo nuevo por revisión, sin sobrescribir).
