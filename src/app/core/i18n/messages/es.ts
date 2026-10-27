/*
 * Spanish — the default language and the source of every key. The English
 * dictionary is typed against this one, so a missing or extra key fails to
 * compile.
 *
 * Placeholders: `{name}` inserts a value, `{^name}` the same with a capital
 * first letter. Numbers, times and durations arrive raw and are formatted per
 * language. Keys name the meaning, not the screen.
 */
export const es = {
  // ── App shell ────────────────────────────────────────────────
  'app.brand': 'LanzaMet',
  'app.description':
    'Cómo está el día en Lanzarote de un vistazo: tiempo, viento, mar y mareas por zonas.',
  'app.skipLink': 'Saltar al contenido',
  'app.home': 'LanzaMet — Inicio',

  'route.today': 'Hoy en Lanzarote',
  'route.zones': 'Zonas',
  'route.sea': 'Mar y mareas',
  'route.plans': '¿Dónde ir hoy?',
  'route.feedback': 'Ayúdanos',
  'route.legal': 'Legal y privacidad',
  'route.notFound': 'Página no encontrada',
  'route.title': '{page} · {brand}',

  // The suggestion is always shown in the language it offers.
  'langSuggest.label': 'Idioma de la web',
  'langSuggest.title': 'LanzaMet también está en español',
  'langSuggest.action': 'Ver en español',
  'langSuggest.dismiss': 'No, gracias',

  'notFound.lead':
    'Esta dirección no existe en LanzaMet. Puede que el enlace esté mal escrito o que la página ya no esté.',
  'notFound.next': 'Puedes seguir por aquí:',

  // ── For search engines: each page's title, description and main heading ──
  // The visible headings stay as they are; these name what each page is about.
  'seo.title.today': 'El tiempo en Lanzarote hoy: viento, mar y mareas',
  'seo.title.zones': 'El tiempo por zonas en Lanzarote: mapa de hoy',
  'seo.title.sea': 'Mareas en Lanzarote hoy: pleamar, bajamar y olas',
  'seo.title.plans': 'Playas sin viento hoy en Lanzarote: dónde ir',
  'seo.description.today':
    'Cómo está hoy el día en Lanzarote: temperatura, viento, mar y mareas por zonas, en palabras claras. Previsión hora a hora y 7 días, sin anuncios.',
  'seo.description.zones':
    'Compara el tiempo de las 9 zonas de Lanzarote en un mapa: temperatura, cielo y viento de Famara a Playa Blanca, para hoy y los próximos días.',
  'seo.description.sea':
    'Pleamar y bajamar estimadas de hoy y mañana, altura y periodo de las olas, mar de fondo y temperatura del agua en las 9 zonas de Lanzarote.',
  'seo.description.plans':
    'Qué playa o rincón de Lanzarote apetece hoy: dónde hay menos viento, el mar más tranquilo o el mejor atardecer, según la previsión de cada zona.',
  'seo.description.legal':
    'Privacidad, condiciones de uso y de dónde salen los datos de LanzaMet: Open-Meteo, Météo-France, Copernicus y AEMET.',
  'seo.description.feedback':
    'Avisa de un error o propón una mejora para LanzaMet, la web del tiempo y el mar en Lanzarote.',
  'seo.description.about':
    'Quién hace LanzaMet y cómo calcula cada dato: modelos, puntos de mar elegidos zona a zona, mareas estimadas, calima y avisos de AEMET.',
  'seo.heading.today': 'El tiempo en Lanzarote hoy',
  'seo.heading.sea': 'Mareas y estado del mar en Lanzarote',
  'seo.heading.plans.place': ' en Lanzarote',
  'plans.heading.lead': '¿Dónde ir hoy',

  // ── About (/sobre) ──────────────────────────────────────────
  'route.about': 'Sobre LanzaMet',
  'settings.about.hint': 'Quién la hace y cómo calcula cada dato.',
  'about.lead':
    'Una web gratuita y sin anuncios para entender en un vistazo cómo está el día en Lanzarote: el tiempo, el viento, el mar y las mareas, zona a zona.',
  'about.who': 'Quién la hace',
  'about.who.text':
    'LanzaMet es un proyecto ideado, diseñado y desarrollado por Fernando Montelongo.',
  'about.studio.member': 'Miembro de',
  'about.studio': 'Agencia de diseño web en Lanzarote.',
  'about.who.link': 'Fernando Montelongo en LinkedIn',
  'about.why': 'Por qué',
  'about.why.text':
    'Las previsiones suelen ser tablas de números pensadas para quien ya sabe leerlas. LanzaMet las cuenta con palabras y compara las zonas de la isla, para decidir rápido dónde ir. Sin cuentas, sin cookies y sin seguimiento.',
  'about.method': 'Cómo se calcula cada dato',
  'about.method.forecast.label': 'El tiempo',
  'about.method.forecast':
    'Modelo DWD ICON a través de Open-Meteo, pedido en las coordenadas de cada zona y actualizado cada 30 minutos.',
  'about.method.sea.label': 'El mar',
  'about.method.sea':
    'Modelos de Météo-France. Como el modelo no llega hasta la orilla, el mar de cada zona se lee en un punto de mar abierto elegido a mano en el lado al que mira su costa, a entre 4 y 18 km.',
  'about.method.tide.label': 'La marea',
  'about.method.tide':
    'Estimada con el nivel del mar del modelo. Comparada con una predicción armónica en Arrecife, se adelanta entre 24 y 37 minutos. No es una tabla oficial ni sirve para navegar.',
  'about.method.dust.label': 'La calima',
  'about.method.dust':
    'Polvo en el aire según el servicio Copernicus (CAMS), con un umbral orientativo.',
  'about.method.official.label': 'Avisos y medidas',
  'about.method.official':
    'Avisos oficiales de AEMET para la isla y su costa, y medidas de sus estaciones. Una zona solo muestra «Medido» si tiene una estación baja a 10 km como máximo.',
  'about.limits': 'Sus límites',
  'about.limits.text':
    'Lo que ves son previsiones de modelos, no garantías. Algunas zonas comparten celda en el modelo y muestran los mismos valores. Antes de bañarte o salir al mar, mira las banderas y sigue a los socorristas.',
  'about.more': 'Fuentes, licencias y privacidad, en detalle',
  'about.feedback': '¿Algo que mejorar? Cuéntanoslo',
  'about.credit': 'Kora Digital Solutions',
  'common.opensElsewhere': 'Se abre en otra web.',
  'about.updated': 'Última revisión: 27 de octubre de 2026.',

  'nav.label': 'Principal',
  'nav.today': 'Hoy',
  'nav.zones': 'Zonas',
  'nav.sea': 'Mar',
  'nav.plans': 'Dónde ir',
  'nav.feedback': 'Ayúdanos',
  'nav.settings': 'Ajustes',
  'nav.settingsDemo': 'Ajustes y demo',

  // ── Shared words and actions ─────────────────────────────────
  'common.retry': 'Reintentar',
  'common.refresh': 'Actualizar',
  'common.close': 'Cerrar',
  'common.backToNow': 'Volver a ahora',
  'common.backToNow.short': 'Ahora',
  'common.seeAll': 'Ver todo',
  'common.now': 'Ahora',
  'common.rightNow': 'Ahora mismo',
  'common.lanzarote': 'Lanzarote',
  'common.changePlace': ': cambiar de zona',
  'common.favorite': 'Favorita: {name}',
  'common.favorite.add': 'Añadir {name} a favoritas',
  'common.favorite.remove': 'Quitar {name} de favoritas',
  'common.value': '{^value}',
  'common.degrees': '{value}°',
  'common.celsius': '{value} °C',
  'common.metres': '{value} m',
  'common.and': '{a} y {b}',

  'day.today': 'Hoy',
  'day.tomorrow': 'Mañana',

  'duration.moment': 'un momento',
  'duration.minutes': '{m} min',
  'duration.hours': '{h} h',
  'duration.hoursMinutes': '{h} h {m} min',

  'time.hourShort': '{hour} h',
  'time.window': '{^day}, de {from} a {to}',
  'time.at': '{day} a las {time}',

  // ── Errors ───────────────────────────────────────────────────
  'error.fallback': 'No hemos podido cargar estos datos.',
  'error.offline': 'No hay conexión con {service}. Comprueba tu red.',
  'error.busy': '{^service} está saturado. Prueba en unos minutos.',
  'error.down': '{^service} no responde ahora mismo.',
  'error.timeout': '{^service} tarda demasiado en responder.',
  'error.unreadable': 'No hemos podido leer los datos de {service}.',
  'error.provider': '{^service}: {reason}',
  'error.mismatch': 'La respuesta de {service} no corresponde a las zonas pedidas.',
  'error.incomplete': 'La previsión ha llegado incompleta. Prueba de nuevo en un rato.',
  'error.unknownPlace': 'No tenemos datos de esa zona.',
  'error.connect': 'No hemos podido conectar con {service}.',
  'service.weather': 'el servicio meteorológico',
  'service.sea': 'el servicio marítimo',
  'service.air': 'el servicio de calidad del aire',
  'service.warnings': 'el servicio de avisos de AEMET',
  'service.observations': 'el servicio de observación de AEMET',
  'service.places': 'el listado de zonas',
  'service.tides': 'el servicio de mareas',

  // ── Places ───────────────────────────────────────────────────
  'area.norte': 'Norte',
  'area.este': 'Este',
  'area.sur': 'Sur',
  'area.oeste': 'Oeste',

  // One sentence about each place, for visitors (kept for place descriptions).
  'place.summary.puerto-del-carmen': 'Avenida de playas largas, resguardada del alisio.',
  'place.summary.arrecife': 'La capital: paseo marítimo, charcos y la playa de El Reducto.',
  'place.summary.playa-blanca': 'Paseo frente a Fuerteventura y aguas casi siempre tranquilas.',
  'place.summary.costa-teguise': 'Playas abiertas al alisio: territorio de windsurf.',
  'place.summary.famara': 'Seis kilómetros de arena bajo el Risco. Olas y viento.',
  'place.summary.la-santa': 'Pueblo pesquero sobre la lava, frente a la ola de El Quemao.',
  'place.summary.orzola': 'Pueblo marinero frente a La Graciosa, con caletas de arena blanca.',
  'place.summary.arrieta':
    'Pueblo marinero con la playa de La Garita, su muelle y la Casa Juanita, la casa azul.',
  'place.summary.el-golfo': 'Un cráter partido por el mar, playa negra y el Charco Verde.',

  // ── Sky and sun ──────────────────────────────────────────────
  'sky.day.despejado': 'Sol',
  'sky.day.poco-nuboso': 'Sol entre nubes',
  'sky.day.nuboso': 'Intervalos nubosos',
  'sky.day.cubierto': 'Cielo cubierto',
  'sky.day.calima': 'Calima',
  'sky.day.lluvia': 'Chubascos',
  'sky.night.despejado': 'Cielo despejado',
  'sky.night.poco-nuboso': 'Algunas nubes',
  'sky.night.nuboso': 'Intervalos nubosos',
  'sky.night.cubierto': 'Cielo cubierto',
  'sky.night.calima': 'Calima',
  'sky.night.lluvia': 'Chubascos',

  'uv.bajo': 'Sol suave',
  'uv.moderado': 'Sol moderado',
  'uv.alto': 'Sol intenso',
  'uv.muy-alto': 'Sol muy intenso',
  'uv.extremo': 'Sol extremo',

  'sun.label': 'Amanecer y atardecer',
  'sun.sunrise': 'Amanecer',
  'sun.sunset': 'Atardecer',
  'sun.untilSunrise': 'Amanece dentro de {duration}',
  'sun.untilSunset': 'Quedan {duration} de sol',
  'sun.tomorrow': 'Mañana amanece a las {time}',
  'sun.down': 'El sol ya se ha puesto',
  'sun.dayLength': '{duration} de luz',
  'sun.missing': 'Hoy no tenemos la hora de amanecer ni de atardecer para esta zona.',

  // ── Wind ─────────────────────────────────────────────────────
  'dir.N': 'norte',
  'dir.NE': 'nordeste',
  'dir.E': 'este',
  'dir.SE': 'sureste',
  'dir.S': 'sur',
  'dir.SO': 'suroeste',
  'dir.O': 'oeste',
  'dir.NO': 'noroeste',
  'wind.from': 'del {dir}',
  'wind.level.0.label': 'Sin viento',
  'wind.level.0.phrase': 'sin apenas viento',
  'wind.level.1.label': 'Viento flojo',
  'wind.level.1.phrase': 'brisa suave',
  'wind.level.2.label': 'Viento moderado',
  'wind.level.2.phrase': 'viento moderado',
  'wind.level.3.label': 'Viento fuerte',
  'wind.level.3.phrase': 'viento fuerte',
  'wind.level.4.label': 'Viento muy fuerte',
  'wind.level.4.phrase': 'viento muy fuerte',
  // The Beaufort scale grouped in five steps (see WIND_LEVEL_MAX).
  'wind.scale.0': 'Calma',
  'wind.scale.1': 'Flojo',
  'wind.scale.2': 'Moderado',
  'wind.scale.3': 'Fuerte',
  'wind.scale.4': 'Muy fuerte',
  'wind.title': 'Viento',
  'wind.strength': 'Intensidad: {scale}',
  'wind.gusts': 'rachas de {gust}',
  'wind.unit': 'km/h',
  'wind.more': '{^from} · {gusts}',
  'wind.labelFrom': '{label} {from}',
  'wind.detail': '{speed} km/h',
  'wind.detailGusts': '{speed} km/h, rachas de {gust}',
  'wind.trend.sube': 'va a más',
  'wind.trend.baja': 'va a menos',
  'wind.tradeWind': 'alisio',

  // ── Sea and tide ─────────────────────────────────────────────
  'sea.level.0.label': 'Mar como un plato',
  'sea.level.0.phrase': 'mar como un plato',
  'sea.level.1.label': 'Mar en calma',
  'sea.level.1.phrase': 'mar en calma',
  'sea.level.2.label': 'Algo de mar',
  'sea.level.2.phrase': 'algo de mar',
  'sea.level.3.label': 'Mar movido',
  'sea.level.3.phrase': 'mar movido',
  'sea.level.4.label': 'Mar bravo',
  'sea.level.4.phrase': 'mar bravo',
  'sea.waves.none': 'Sin apenas olas',
  'sea.waves.cm': 'Olas de unos {cm} cm',
  'sea.waves.m': 'Olas de {m} m',
  'sea.water': 'Agua a {temp} °C',
  'sea.swell': 'Mar de fondo {from}, {height} m cada {period} s',
  'sea.swell.from': 'Llega {from}',
  'sea.swell.short': 'Ondas cortas, de viento cercano',
  'sea.swell.mid': 'Ondas medias',
  'sea.swell.long': 'Ondas largas, llegan de lejos',
  'sea.swell.numbers': '{height} m cada {period} s',
  'sea.swell.detail': '{character} · {numbers}',
  'sea.swell.none': 'Apenas hay',
  'sea.swell.none.text': 'Sin ondas que lleguen de lejos',
  'sea.wavesEvery': 'Cada {period} s',
  'sea.waterFeel.cold': 'Fría',
  'sea.waterFeel.cool': 'Fresca',
  'sea.waterFeel.pleasant': 'Agradable',
  'sea.waterFeel.warm': 'Templada',

  'tide.kind.pleamar': 'Pleamar',
  'tide.kind.bajamar': 'Bajamar',
  'tide.now.pleamar': 'Marea alta ahora',
  'tide.now.bajamar': 'Marea baja ahora',
  'tide.subiendo': 'La marea está subiendo',
  'tide.bajando': 'La marea está bajando',
  'tide.next.at': '{kind} a las {time}',
  'tide.next.around': '{kind} hacia las {time}',

  // ── Verdicts: the moment in a few words ──────────────────────
  // Sentences
  'verdict.plain': '{sky} y {wind} en {place}.',
  'verdict.sunrise.sentence': '{sky} y {wind}. Amanece a las {time}.',
  'verdict.sunset.sentence': '{sky} y {wind}. El sol se pone a las {time}.',
  'verdict.shade.sentence': '{sky} y {wind} en {place}. Busca la sombra y bebe agua.',
  // Hazards, said for the time of day
  'verdict.rain': 'Llueve, cosa rara',
  'verdict.rain.dawn': 'Amanece lloviendo',
  'verdict.rain.night': 'Noche de lluvia',
  'verdict.rain.sentence': 'Chubascos en {place}. Mejor un plan a cubierto.',
  'verdict.rain.night.sentence': 'Chubascos y {wind} en {place}.',
  'verdict.wind': 'Sopla con ganas',
  'verdict.wind.dawn': 'Amanece con viento',
  'verdict.wind.night': 'Noche de viento',
  'verdict.wind.sentence': '{wind}. Mejor buscar una playa resguardada.',
  'verdict.calima': 'Día de calima',
  'verdict.calima.dawn': 'Amanece con calima',
  'verdict.calima.night': 'Noche de calima',
  'verdict.calima.sentence': 'Cielo turbio y aire seco en {place}. Agua y sombra.',
  'verdict.calima.night.sentence': 'Aire seco y polvo en suspensión en {place}.',
  'verdict.windRising': 'El viento se está levantando',
  'verdict.windRising.sentence': 'Mejor buscar una playa resguardada.',
  'verdict.waves': 'Hay olas',
  'verdict.waves.sentence': '{sea} en {place}: día de surf, no de baño.',
  // Night and small hours
  'verdict.smallHours.cool': 'Madrugada fresca',
  'verdict.smallHours.mild': 'Madrugada templada',
  'verdict.smallHours.warm': 'Madrugada cálida',
  'verdict.night.cool': 'Noche fresca',
  'verdict.night.mild': 'Noche templada',
  'verdict.night.warm': 'Noche cálida',
  'verdict.night.starry': 'Noche estrellada',
  'verdict.night.cloudy': 'Noche nublada',
  // First light and sunset
  'verdict.dawn.clear': 'Amanece despejado',
  'verdict.dawn.cloudy': 'Amanece nublado',
  'verdict.dawn.cool': 'Amanece fresco',
  'verdict.dawn.mild': 'Amanece templado',
  'verdict.dawn.warm': 'Amanece cálido',
  'verdict.sunset.clear': 'Atardecer despejado',
  'verdict.sunset.clouds': 'Atardecer entre nubes',
  'verdict.sunset.grey': 'Atardecer gris',
  // Morning, midday and afternoon
  'verdict.hot': 'Aprieta el calor',
  'verdict.strongSun': 'Sol de justicia',
  'verdict.sunnyWindy': 'Sol, pero con viento',
  'verdict.sunnyWindy.sentence': '{wind} en {place}. Para la toalla, mejor una playa resguardada.',
  'verdict.beach.today': 'Hoy apetece playa',
  'verdict.beach.tomorrow': 'Mañana apetece playa',
  'verdict.beach.later': 'Día de playa',
  'verdict.beach.afternoon': 'Tarde de playa',
  'verdict.goodDay': 'Buen día para salir',
  'verdict.goodAfternoon': 'Buena tarde para salir',
  'verdict.lookout': 'Día perfecto para asomarse',
  'verdict.lookout.sentence': '{plain} Costa para mirar, no para bañarse.',
  'verdict.grey': 'Día gris y templado',
  'verdict.grey.cool': 'Día gris y fresco',
  'verdict.grey.warm': 'Gris, pero cálido',
  'verdict.grey.sentence': '{sky} en {place}. Buen momento para pasear.',
  'verdict.cool': 'Día fresco',
  'verdict.sunnySpells': 'Ratos de sol',
  'verdict.calm': 'Día tranquilo',

  // ── The island and each place ────────────────────────────────
  'zone.skyCalm': '{sky} y calma',
  'zone.skyBreeze': '{sky} y brisa',
  'island.rain': 'Chubascos repartidos por la isla. Busca los claros.',
  'island.calima': 'Calima en toda la isla: cielo blanquecino y aire seco.',
  'island.calm': 'Calma en toda la isla.',
  'island.northWindWaves': 'Viento y olas en el norte. El sur, resguardado.',
  'island.northWind': 'Más viento en el norte. El sur, resguardado.',
  'island.southWind': 'Esta vez el viento entra por el sur. El norte, más tranquilo.',
  'island.similar': 'Condiciones parecidas en toda la isla.',

  // ── The week ─────────────────────────────────────────────────
  'week.rain': 'Chubascos',
  'week.calimaHeat': 'Calima y calor',
  'week.calima': 'Calima',
  'week.overcast': 'Cubierto',
  'week.cloudWind': 'Nubes y viento',
  'week.cloudSun': 'Nubes y claros',
  'week.sunStrongWind': 'Sol y viento fuerte',
  'week.sunSomeWind': 'Sol y algo de viento',
  'week.sunBreeze': 'Sol y brisa',
  'week.sunClouds': 'Sol entre nubes',
  'week.change.rainArrives': 'Llega la lluvia',
  'week.change.calimaArrives': 'Llega la calima',
  'week.change.calimaLeaves': 'Se va la calima',
  'week.change.sunReturns': 'Vuelve el sol',
  'week.change.moreWind': 'Más viento',
  'week.change.lessWind': 'Amaina el viento',
  'week.change.warmer': 'Más calor',
  'week.change.cooler': 'Refresca',
  'week.min': 'mínima',
  'week.max': 'máxima',
  'week.meanWind': 'viento medio',
  'week.head.wind': 'Viento medio',
  'week.head.temps': 'Máx. / mín.',
  // ── Choosing a day ────────────────────────────────────────────
  'dayPicker.title': '¿Qué día quieres ver?',
  'dayPicker.hint': 'El tiempo, el mar y las zonas de la isla pasan a ese día.',
  'dayPicker.change': ', elegir otro día',
  'sun.dayLength.full': 'Un día con {duration} de luz',
  'today.sun.day': 'Amanece a las {sunrise} y atardece a las {sunset}.',
  'today.hours.day': '{^day}, hora a hora',
  'today.plans.tomorrow': '¿Dónde ir mañana?',
  'today.plans.later': '¿Dónde ir el {day}?',
  'today.noPlan.day': 'Ese día no hay un plan claro',
  'today.details.day': '{^day}, en detalle',
  'hours.backTo': 'Volver a las {time}',
  'hours.labelDay': 'Las 24 horas del día. Usa las flechas para recorrerlas.',
  'seaPage.dayTitle': 'Mareas del {day}',
  'seaPage.dayTitle.tomorrow': 'Mareas de mañana',
  'seaPage.dayLead': 'Pleamar a las {high}; bajamar a las {low}.',
  'seaPage.dayLead.high': 'Pleamar a las {high}.',
  'seaPage.dayLead.low': 'Bajamar a las {low}.',
  'seaPage.curve.day': 'La marea, hora a hora',
  'seaPage.seaTitle.day': 'El mar en {place}, {when}',
  'seaPage.when.tomorrow': 'mañana a mediodía',
  'seaPage.when.later': 'el {day} a mediodía',
  'share.when.later': 'el {day} a las {time}',

  // ── Plans ────────────────────────────────────────────────────
  'plan.beach.title': 'Playa en {place}',
  'plan.beach.reason': '{sky}, {wind}.',
  'plan.beach.reasonSea': '{sky}, {wind} y {sea}.',
  'plan.beach.warning': '{reason} Hay aviso costero: báñate solo en zonas vigiladas.',
  'plan.shelter.title': 'Sin viento en {place}',
  'plan.shelter.reason':
    'El viento {from} apenas llega: {here} km/h, frente a {there} en {windiest}.',
  'plan.calmSea.title': 'Mar tranquilo en {place}',
  'plan.calmSea.reason': '{waves} según la previsión: el mar más tranquilo de la isla.',
  'plan.sunset.title': 'Atardecer en {place}',
  'plan.sunset.clear': 'El sol se pone a las {time} con el horizonte despejado.',
  'plan.sunset.clouds': 'El sol se pone a las {time} entre algunas nubes.',
  'plan.walk.title': 'Paseo por {place}',
  'plan.walk.morning': 'A primera hora, con {temp} °C y el sol todavía suave.',
  'plan.walk.evening': 'Con {temp} °C y el sol ya bajo, se camina a gusto.',
  'plan.surf.title': 'Olas en {place}',
  'plan.surf.reason': '{waves} y viento {from}: para quien ya sabe surfear.',

  // ── Today ────────────────────────────────────────────────────
  'today.region': 'El tiempo ahora',
  'today.temperature': 'Temperatura: ',
  'today.clock.island': 'En Lanzarote',
  'today.clock.zone': 'Hora de Canarias',
  'today.todayRange': 'Máxima {max}° · mínima {min}°',
  'today.settings': 'Ajustes y fuentes de datos',
  'today.demo': 'Demo',
  'today.demoSettings': 'Datos ficticios: abrir ajustes de la demo',
  'today.unknown': 'No sabemos qué tal está hoy',
  'today.sun.rises': 'Amanece a las {time}, en {duration}.',
  'today.sun.sets': 'Atardece a las {time}, en {duration}.',
  'today.loading': 'Cargando el tiempo',
  'today.stale': 'No hemos podido actualizar. Te mostramos los últimos datos.',
  'today.nowTitle': '{moment}: viento, mar y marea',
  'today.hours': 'Próximas horas',
  'today.plans': '¿Dónde ir hoy?',
  'today.noPlan': 'Hoy no hay un plan claro',
  'today.noPlan.text':
    'El tiempo no acompaña en ninguna zona. Echa un vistazo a los próximos días.',
  'today.compareFailed': 'No hemos podido comparar las zonas',
  'today.details': 'Hoy, en detalle',
  'today.days': 'Próximos días',

  // ── Sharing the weather ──────────────────────────────────────
  'share.button': 'Compartir el tiempo en {name}',
  'share.button.later': 'Compartir la previsión de {name}',
  'share.preparing': 'Preparando la imagen…',
  'share.text.now': 'Así está el tiempo en {place} {emoji}.',
  'share.text.later': 'Así estará el tiempo en {place} {when} {emoji}.',
  'share.text.link': '{text} Consulta la previsión completa de Lanzarote aquí: {url}',
  'share.when.now': 'ahora',
  'share.when.today': 'hoy a las {time}',
  'share.when.tomorrow': 'mañana a las {time}',
  'share.card.forecast': 'Previsión',
  'share.card.feels': 'Sensación de {temp}°',
  'share.card.range': 'Máx. {max}° · mín. {min}°',
  'share.card.tide.estimate': '{next} · estimada',
  'share.card.tagline': 'El tiempo y el mar en Lanzarote',
  'share.card.credit': 'Previsión de Open-Meteo.com',
  'share.card.alt': 'El tiempo en {place}, {when}: {temp}°. {headline}.',
  'share.sheet.title': 'Compartir el tiempo',
  'share.sheet.intro':
    'Este navegador no deja adjuntar la imagen al compartir. Descárgala o cópiala y añádela a tu mensaje.',
  'share.sheet.ready': 'La imagen está lista. Elige cómo enviarla.',
  'share.sheet.failed': 'No hemos podido preparar la imagen. Puedes compartir el texto igualmente.',
  'share.sheet.message': 'Mensaje',
  'share.action.share': 'Compartir la imagen',
  'share.action.download': 'Descargar la imagen',
  'share.action.copyImage': 'Copiar la imagen',
  'share.action.copyText': 'Copiar el texto',
  'share.action.copyTextLink': 'Copiar el texto y el enlace',
  'share.action.textOnly': 'Compartir solo el texto',
  'share.action.whatsapp': 'Enviar el texto por WhatsApp',
  'share.action.whatsapp.hint':
    'WhatsApp recibe solo el texto: la imagen tendrás que adjuntarla tú.',
  'share.copied.image': 'Imagen copiada',
  'share.copied.text': 'Texto copiado',
  'share.copyFailed': 'No se ha podido copiar',

  'fact.feels': 'Sensación',
  'fact.feels.same': '{temp} °C, lo que marca el termómetro',
  'fact.feels.sun': '{temp} °C: el sol calienta más de lo que parece',
  'fact.feels.mild': '{temp} °C: se nota más templado de lo que marca',
  'fact.feels.wind': '{temp} °C: el viento refresca',
  'fact.uv': 'Sol',
  'fact.uv.window': '{uv} de {from} a {to}. Protégete.',
  'fact.uv.rest': '{uv} el resto del día.',
  'fact.uv.day': '{uv} todo el día.',
  'fact.uv.night': 'Ya sin sol hasta mañana.',
  'fact.water': 'Agua',
  'fact.observed': 'Medido',
  'fact.observed.calm': 'sin apenas viento',
  'fact.observed.wind': 'viento {from} a {speed} km/h',
  'fact.observed.source': '{station} (AEMET), a las {time}',
  'fact.webcam': 'En directo',

  // ── Live cameras ─────────────────────────────────────────────
  'webcam.live': 'En directo',
  'webcam.watch': 'Ver {view} en directo',
  'webcam.detail': ': {view}, cámara de {provider} ({place}). Se abre en otra web.',

  'conditions.wind.hours': 'Ver el viento hora a hora',
  'conditions.sea.none': 'Sin previsión del mar',
  'conditions.sea.none.text': 'Esta zona aún no tiene datos marítimos.',
  'conditions.sea.error': 'El mar, sin datos ahora',
  'conditions.sea.error.text': 'No hemos podido cargarlos.',
  'conditions.tide.next': '{next} · en {until}',
  'conditions.tide.estimate': 'estimación',
  'conditions.tide.none': 'Sin datos de marea',
  'conditions.tide.none.text': 'No hay previsión ni estimación de marea para esta zona.',
  'conditions.tide.error': 'La marea, sin datos ahora',
  'conditions.tide.error.text': 'No hemos podido cargarla.',

  'hours.label': 'Próximas 24 horas. Usa las flechas para recorrerlas.',
  'hours.cellDetail': '{sky}, {wind}',
  'hours.hint': 'Elige una hora para verla arriba',
  'hours.wind': 'Viento',
  'hours.previous': 'Horas anteriores',
  'hours.next': 'Horas siguientes',

  // ── Location picker ──────────────────────────────────────────
  'picker.title': 'Elige zona',
  'picker.search': 'Busca un pueblo o municipio',
  'picker.searchLabel': 'Buscar zona',
  'picker.favorites': 'Tus zonas',
  'picker.previous': 'Zonas anteriores',
  'picker.next': 'Más zonas favoritas',
  'picker.error': 'No hemos podido cargar las zonas',
  'picker.noMatch': 'Ninguna zona coincide',
  'picker.noMatch.text': 'Prueba con el nombre de un pueblo, una playa o un municipio.',

  // ── Settings ─────────────────────────────────────────────────
  'settings.title': 'Ajustes',
  'settings.titleDemo': 'Ajustes y demo',
  'settings.language': 'Idioma',
  'settings.appearance': 'Apariencia',
  'settings.theme.auto': 'Según la hora',
  'settings.theme.auto.hint': 'De día claro, de noche oscuro, con el sol de la zona.',
  'settings.theme.light': 'Claro',
  'settings.theme.dark': 'Oscuro',
  'settings.legal.hint': 'De dónde salen los datos, privacidad y condiciones de uso.',
  'settings.feedback.hint': 'Avísanos de un error o propón una mejora.',
  'settings.more': 'Más',

  // ── Legal and privacy (/legal) ──────────────────────────────
  'legal.lead': 'Qué datos usa LanzaMet, de dónde salen y en qué condiciones puedes usarla.',
  'legal.updated': 'Última revisión: 24 de octubre de 2026.',
  'legal.privacy': 'Privacidad',
  'legal.privacy.summary':
    'LanzaMet no tiene cuentas ni registro, no usa cookies y no lleva publicidad ni herramientas de analítica o seguimiento.',
  'legal.privacy.location':
    'No usamos tu ubicación. El tiempo se pide para toda la isla a la vez, así que ni siquiera la zona que miras sale de tu dispositivo.',
  'legal.privacy.device':
    'En tu dispositivo, y solo ahí, se guardan el idioma, la apariencia, la zona elegida y tus favoritas, la última copia de los datos del tiempo y si has instalado la web, con un recuento de visitas para no insistir. Nunca se envía a ningún sitio.',
  'legal.privacy.offline':
    'La web guarda también una copia de sí misma para abrirse rápido y funcionar sin conexión.',
  'legal.privacy.erase':
    'Puedes borrarlo todo cuando quieras borrando los datos de este sitio en los ajustes de tu navegador.',
  'legal.privacy.servers':
    'Los datos llegan desde nuestro servidor, alojado en Cloudflare; si no responde, tu navegador los pide directamente a Open-Meteo. Como en cualquier web, estos servicios ven datos técnicos de la conexión, como la dirección IP y el navegador, que necesitan para funcionar y protegerse de abusos.',
  'legal.privacy.share':
    'Al compartir el tiempo, la imagen se crea en tu dispositivo y la envías tú, con la aplicación que elijas.',
  'legal.privacy.feedback': 'Si nos escribes desde Ayúdanos',
  'legal.terms': 'Condiciones de uso',
  'legal.terms.free':
    'LanzaMet es gratuita y sirve para informarte del tiempo y el mar en Lanzarote. Para usarla no necesitas registrarte.',
  'legal.terms.asIs':
    'La información se ofrece tal cual, sin garantía de que sea exacta, completa o esté siempre disponible. Las previsiones y la marea son estimaciones de modelos y pueden fallar.',
  'legal.terms.responsibility':
    'No la uses como única base para decisiones de seguridad, para navegar ni para actividades de riesgo. No respondemos de los daños que puedan derivarse de su uso.',
  'legal.terms.thirdParty':
    'Los datos pertenecen a sus fuentes y se usan con sus licencias, que se citan en esta página. Los enlaces a otras webs llevan a sitios que no controlamos.',
  'legal.terms.changes':
    'Podemos cambiar la web o estas condiciones, o dejar de ofrecerla, en cualquier momento. Las que valen son siempre las de esta página.',
  'legal.contact': 'Contacto',
  'legal.contact.text':
    'Para cualquier duda sobre estos textos o sobre tus datos, escríbenos desde Ayúdanos.',
  'legal.contact.link': 'Ir a Ayúdanos',
  'legal.sources': 'De dónde salen los datos',
  'legal.source.forecast': 'Previsión del tiempo',
  'legal.source.forecast.text':
    'modelo DWD ICON. Licencia CC BY 4.0. Se actualiza cada 30 minutos.',
  'legal.source.sea': 'Oleaje, agua y marea',
  'legal.source.sea.text':
    'Open-Meteo Marine, modelos de Météo-France, en mar abierto frente a cada zona. La marea es una estimación del modelo, no una tabla oficial: no sirve para navegar.',
  'legal.source.dust': 'Calima',
  'legal.source.dust.text':
    'Polvo en suspensión de Copernicus CAMS, vía Open-Meteo. Contiene información modificada del Copernicus Atmosphere Monitoring Service.',
  'legal.source.warnings': 'Avisos oficiales',
  'legal.source.warnings.text': 'Plan Meteoalerta. {status}.',
  'legal.source.observations': 'Medidas de estaciones',
  'legal.source.observations.text': 'AEMET OpenData. {status}.',
  'legal.source.map': 'Mapa de la isla',
  'legal.source.map.credit': 'colaboradores de OpenStreetMap',
  'legal.source.map.text':
    'Licencia ODbL. Contorno simplificado e incluido en la web: no se consulta en vivo.',
  'legal.source.webcams': 'Cámaras en directo',
  'legal.source.webcams.text':
    'Enlaces a cámaras públicas de {providers}. Se abren en su web, que no controlamos, y pueden estar apagadas o mostrar otra cosa.',
  'legal.status.ready': 'Conectado',
  'legal.status.error': 'Sin conexión ahora',
  'legal.status.unavailable': 'No disponible en esta instalación',
  'legal.status.noKey': 'Pendiente de credenciales de AEMET',
  'legal.status.checking': 'Comprobando…',
  'legal.disclaimer':
    'Son previsiones y avisos, no garantías: antes de bañarte o salir al mar, mira las banderas y sigue las indicaciones de socorristas y autoridades.',

  // ── Installing the web as an app ────────────────────────────
  'install.group': 'Acceso rápido',
  'install.option.title.mobile': 'Añádela a tu pantalla de inicio',
  'install.option.title.desktop': 'Tenla a mano en el ordenador',
  'install.option.hint.mobile': 'Con su icono, entre tus apps. Sin tiendas.',
  'install.option.hint.desktop': 'Como app, en su propia ventana, o en tus marcadores.',
  'install.option.hint.desktop.prompt': 'En su propia ventana, con su icono, como una app.',
  'install.option.installed': 'Ya la tienes instalada',
  'install.option.installed.mobile': 'Ábrela desde tu pantalla de inicio.',
  'install.option.installed.desktop': 'Ábrela desde el escritorio o el menú de aplicaciones.',
  'install.action.install': 'Instalar',
  'install.action.how': 'Ver cómo',
  'install.action.more': 'Ver otras formas',
  'install.done': 'Instalada. La encontrarás entre tus apps.',

  'install.guide.title.mobile': 'Añadir a la pantalla de inicio',
  'install.guide.title.desktop': 'Tener LanzaMet a mano',
  'install.guide.preview.mobile': 'Así aparecerá entre tus apps',
  'install.guide.preview.desktop': 'Así aparecerá en tu ordenador',
  'install.guide.device': 'Instrucciones para',
  'install.device.ios': 'iPhone o iPad',
  'install.device.android': 'Android',
  'install.device.desktop': 'Ordenador',
  'install.guide.installed': 'Ya la tienes instalada en este dispositivo.',
  'install.guide.prompt': 'Tu navegador puede instalarla ahora mismo.',
  'install.guide.prompt.menu': 'También puedes hacerlo desde el menú del navegador.',
  'install.guide.note':
    'Es la misma web, gratis y sin tiendas: se actualiza sola y apenas ocupa espacio.',

  'install.ios.intro': 'Safari no instala webs con un botón: se hace desde su menú Compartir.',
  'install.ios.inApp':
    'Estás viendo la web dentro de otra app. Ábrela en Safari y añádela desde allí.',
  'install.ios.share': 'Toca «Compartir»',
  'install.ios.share.safari':
    'En la barra de Safari. Si no lo ves, toca antes el botón de los tres puntos.',
  'install.ios.share.other': 'En la barra de direcciones o en el menú del navegador.',
  'install.ios.add': 'Elige «Añadir a pantalla de inicio»',
  'install.ios.add.hint': 'Si no aparece, desliza la lista hacia arriba o toca «Ver más».',
  'install.ios.confirm': 'Toca «Añadir»',
  'install.step.done': 'El icono aparecerá entre tus apps.',

  'install.android.intro': 'Tu navegador lo hace desde su menú.',
  'install.android.inApp':
    'Estás viendo la web dentro de otra app. Ábrela en tu navegador y añádela desde allí.',
  'install.android.menu': 'Abre el menú del navegador',
  'install.android.menu.dots': 'Es el botón de los tres puntos, junto a la dirección.',
  'install.android.menu.samsung': 'Es el botón de las tres rayas, abajo a la derecha.',
  'install.android.add': 'Elige «Instalar aplicación» o «Añadir a pantalla de inicio»',
  'install.android.add.samsung': 'Elige «Añadir página a» y luego «Pantalla de inicio»',
  'install.android.confirm': 'Confirma con «Instalar» o «Añadir»',

  'install.desktop.app': 'Como app',
  'install.desktop.app.text':
    'Se abre en su propia ventana, con su icono, sin pestañas ni barra de direcciones.',
  'install.desktop.chromium': 'Pulsa el icono de instalar',
  'install.desktop.chromium.hint':
    'Al final de la barra de direcciones. Si no lo ves, búscalo en el menú del navegador, en «Guardar y compartir».',
  'install.desktop.edge.hint':
    'En la barra de direcciones. Si no lo ves, búscalo en el menú del navegador, en «Aplicaciones».',
  'install.desktop.safari': 'Elige «Archivo» › «Añadir al Dock»',
  'install.desktop.safari.hint': 'En la barra de menús de Safari, con macOS Sonoma o posterior.',
  'install.desktop.firefox': 'Firefox no instala webs como apps',
  'install.desktop.firefox.hint':
    'Puedes hacerlo con Chrome o Edge, o con Safari en un Mac. O guárdala en marcadores.',
  'install.desktop.generic': 'Desde el navegador',
  'install.desktop.generic.hint':
    'En Chrome y Edge, con el icono de instalar de la barra de direcciones. En Safari para Mac, en «Archivo» › «Añadir al Dock».',
  'install.desktop.bookmark': 'En marcadores',
  'install.desktop.bookmark.text': 'Se queda en tu navegador, junto a tus otras webs, a un clic.',
  'install.desktop.bookmark.press': 'Pulsa',
  'install.desktop.bookmark.or': 'o',
  'install.desktop.shortcut':
    'Para crear un acceso directo, arrastra al escritorio el icono que hay a la izquierda de la dirección.',

  'install.invite.label': 'Instalar LanzaMet',
  'install.invite.title': 'Ten LanzaMet a mano',
  'install.invite.text.mobile': 'Añádela a tu pantalla de inicio y ábrela como una app.',
  'install.invite.text.desktop': 'Instálala y ábrela en su propia ventana, como una app.',
  'install.invite.dismiss': 'Ahora no',

  // ── Official warnings and credits ────────────────────────────
  'warning.region': 'Avisos meteorológicos oficiales',
  'warning.title': 'Aviso {level}: {phenomenon}',
  'warning.level.amarillo': 'amarillo',
  'warning.level.naranja': 'naranja',
  'warning.level.rojo': 'rojo',
  'warning.area.island': 'Lanzarote',
  'warning.area.coast': 'Costa de Lanzarote',
  'warning.until.today': 'En vigor hasta las {time}',
  'warning.until.tomorrow': 'En vigor hasta mañana a las {time}',
  'warning.until.weekday': 'En vigor hasta el {weekday} a las {time}',
  'warning.source': 'Avisos oficiales de',
  'warning.phenomenon.AT': 'temperaturas máximas',
  'warning.phenomenon.BT': 'temperaturas mínimas',
  'warning.phenomenon.CO': 'costeros',
  'warning.phenomenon.NE': 'nevadas',
  'warning.phenomenon.NI': 'nieblas',
  'warning.phenomenon.PR': 'lluvias',
  'warning.phenomenon.TO': 'tormentas',
  'warning.phenomenon.VI': 'vientos',
  'warning.phenomenon.VS': 'polvo en suspensión',
  'warning.phenomenon.DU': 'polvo en suspensión',
  'warning.phenomenon.GL': 'galernas',
  'warning.phenomenon.OL': 'olas de calor',

  'credit.weather': 'Previsión del modelo DWD ICON, de',
  'credit.sea': 'Oleaje y marea estimada de modelos de Météo-France, vía',
  'credit.island': 'Previsión de cada zona, de',
  'credit.demo': 'Datos ficticios de demostración',
  'credit.fetched': '· consultada a las {time}',
  'credit.licenceUrl': 'https://creativecommons.org/licenses/by/4.0/deed.es',

  // ── Zones ────────────────────────────────────────────────────
  'zones.title': 'Lanzarote, zona a zona',
  'zones.error': 'No hemos podido cargar las zonas',
  'zones.loading': 'Cargando zonas',
  'zones.map': 'Mapa de la isla',
  'zones.legend.good': 'Buen día',
  'zones.legend.fair': 'Regular',
  'zones.legend.poor': 'Mejor otro plan',
  'zones.calm': 'Sin apenas viento en la isla',
  'zones.wind': 'Viento {from}',
  'zones.openDay': 'Ver el día',
  'zones.all': 'Todas las zonas',

  // ── Sea ──────────────────────────────────────────────────────
  'seaPage.next': '{next}, dentro de {until}.',
  'seaPage.noTide.title': 'Sin datos de marea en {place}',
  'seaPage.noTide.text': 'No hay previsión ni estimación de marea para esta zona.',
  'seaPage.tideError': 'La marea, sin datos ahora',
  'seaPage.curve': 'La marea de hoy',
  'seaPage.curveNow': 'Ahora · {time}',
  'seaPage.extremes': 'Pleamares y bajamares',
  'seaPage.extremesEstimated': 'Pleamares y bajamares (estimadas)',
  'seaPage.source.station': 'Mareógrafo: {name}.',
  'seaPage.source.reference': 'Predicción de referencia: {name}.',
  'seaPage.source.demo': 'Datos ficticios.',
  'seaPage.noTideHere': 'Esta zona no tiene previsión de mareas',
  'seaPage.nearest': 'La más cercana con datos es {place}.',
  'seaPage.goNearest': 'Ver la marea en {place}',
  'seaPage.tideLoadError': 'No hemos podido cargar la marea',
  'seaPage.seaTitle': 'El mar en {place}',
  'seaPage.offshore':
    'Previsión del modelo en mar abierto, a unos {km} km de la zona. En la orilla las olas pueden ser distintas.',
  'seaPage.seaNone': 'Sin previsión del mar',
  'seaPage.seaNone.text': 'El modelo marítimo no tiene datos para esta zona.',
  'seaPage.seaError': 'No hemos podido cargar el estado del mar',
  'seaPage.calmest': 'Dónde está el mar más tranquilo',
  'seaPage.facet.waves': 'Oleaje',
  'seaPage.facet.swell': 'Mar de fondo',
  'seaPage.facet.water': 'Agua',
  'seaPage.waterNone': 'Sin dato',
  'seaPage.calmestHint': 'De menos a más olas, según la previsión',

  // ── Plans page ───────────────────────────────────────────────
  'plans.lead':
    'Sugerencias según la previsión de cada zona. Son orientativas, no una garantía: en el mar, haz caso a las banderas y a los socorristas.',
  'plans.leadDemo':
    'Sugerencias según el tiempo de cada zona. En esta versión son ejemplos con datos ficticios.',
  'plans.more': 'Más ideas',
  'plans.now': 'Ahora en {place}',
  'plans.loading': 'Cargando sugerencias',

  // ── Feedback ─────────────────────────────────────────────────
  'feedback.lead':
    'Si algo falla o se te ocurre cómo hacer la web más útil, cuéntanoslo. Leemos cada mensaje.',
  'feedback.form': 'Formulario de comentarios',

  'feedback.kind.legend': '¿Qué quieres contarnos?',
  'feedback.kind.bug': 'Error',
  'feedback.kind.bug.hint': 'Algo falla o se ve mal',
  'feedback.kind.suggestion': 'Sugerencia',
  'feedback.kind.suggestion.hint': 'Algo nuevo que te gustaría ver',
  'feedback.kind.improvement': 'Mejora',
  'feedback.kind.improvement.hint': 'Algo que ya existe, pero mejor',
  'feedback.kind.other': 'Otro',
  'feedback.kind.other.hint': 'Cualquier otra cosa',

  'feedback.message.label': 'Tu mensaje',
  'feedback.message.limits': 'Entre {min} y {max} caracteres.',
  'feedback.message.count': '{count} de {max} caracteres',
  'feedback.message.counter': '{count}/{max}',
  'feedback.message.placeholder.none': 'Elige arriba de qué se trata y cuéntanoslo aquí.',
  'feedback.message.placeholder.bug': 'Qué ha pasado, en qué pantalla y qué esperabas ver.',
  'feedback.message.placeholder.suggestion': 'Qué te gustaría encontrar y para qué te serviría.',
  'feedback.message.placeholder.improvement': 'Qué cambiarías y por qué.',
  'feedback.message.placeholder.other': 'Lo que quieras contarnos.',

  'feedback.email.label': 'Correo electrónico (opcional)',
  'feedback.email.placeholder': 'nombre@ejemplo.com',
  'feedback.email.hint': 'Solo para responderte. Nunca para nada más.',
  'feedback.honeypot': 'Deja este campo vacío',

  'feedback.invalid.kind': 'Elige qué quieres contarnos.',
  'feedback.invalid.messageEmpty': 'Escribe tu mensaje.',
  'feedback.invalid.messageShort': 'Cuéntanos un poco más: al menos {min} caracteres.',
  'feedback.invalid.messageLong': 'Te sobran {n} caracteres. Resume un poco.',
  'feedback.invalid.email': 'Este correo no parece válido. Revísalo o déjalo en blanco.',
  'feedback.invalid.emailLong': 'Este correo es demasiado largo.',

  'feedback.submit': 'Enviar',
  'feedback.sending': 'Enviando…',

  'feedback.failed': 'No se ha enviado',
  'feedback.failed.not-configured':
    'El envío de comentarios aún no está activado en esta versión de la web. Tu mensaje sigue aquí.',
  'feedback.failed.offline':
    'No hay conexión con el servicio de envío. Comprueba tu red y vuelve a intentarlo.',
  'feedback.failed.timeout':
    'El servicio de envío tarda demasiado en responder. Prueba otra vez en un momento.',
  'feedback.failed.rate-limited':
    'El servicio de envío está recibiendo demasiados mensajes. Prueba en unos minutos.',
  'feedback.failed.too-soon': 'Espera {wait} y vuelve a intentarlo.',
  'feedback.failed.duplicate':
    'Este mismo mensaje ya nos llegó desde aquí. Si quieres añadir algo, cámbialo un poco.',
  'feedback.failed.rejected':
    'El servicio de envío no ha aceptado el mensaje. Revisa el texto y vuelve a intentarlo.',
  'feedback.failed.unavailable':
    'El servicio de envío no ha confirmado que lo haya recibido, así que no lo damos por enviado. Prueba de nuevo en un rato.',
  'feedback.failed.kept': 'Tu mensaje sigue aquí.',

  'feedback.notConfigured': 'Envío aún no activado',
  'feedback.notConfigured.text':
    'Esta versión de la web no tiene configurado el servicio de recepción, así que el formulario todavía no puede enviar nada.',

  'feedback.sent': '¡Recibido, gracias!',
  'feedback.sent.withEmail': 'Tu mensaje ha llegado. Si hace falta, te escribiremos a {email}.',
  'feedback.sent.noEmail':
    'Tu mensaje ha llegado. No nos has dejado correo, así que no podremos contestarte.',
  'feedback.sent.again': 'Enviar otro comentario',

  'feedback.privacy': 'Cómo tratamos tus datos',
  'feedback.privacy.what':
    'Enviamos el tipo de comentario, tu mensaje y el idioma de la web, y tu correo solo si lo escribes. Nunca tu ubicación, tus zonas ni datos del dispositivo.',
  'feedback.privacy.who':
    'Los recibe {provider}, un servicio externo que nos los reenvía por correo electrónico. Puede conservar una copia durante un tiempo, según sus condiciones.',
  'feedback.privacy.technical':
    'Como cualquier servicio en Internet, el de recepción ve datos de la conexión, como la dirección IP y el navegador, y puede usarlos, por ejemplo, para frenar el spam.',
  'feedback.privacy.use':
    'Usamos los mensajes solo para corregir errores y mejorar la web, y el correo solo para responderte. No lo usamos para publicidad ni lo cedemos a nadie.',
  'feedback.privacy.content': 'No escribas en el mensaje datos personales que no hagan falta.',
  'feedback.privacy.device':
    'En este dispositivo solo guardamos cuándo enviaste tus últimos mensajes y una huella del último (no su texto), para evitar envíos repetidos.',
  'feedback.privacy.providerLink': 'Política de privacidad de Web3Forms',
  'feedback.privacy.erase':
    'Si nos dejaste tu correo y quieres que borremos tu mensaje, pídenoslo en un nuevo comentario con ese mismo correo.',

  // ── Demo build only ──────────────────────────────────────────
  'demo.intro':
    'Esta versión usa datos ficticios. Cambia el escenario o la hora para ver cómo responde la interfaz a otros días en la isla.',
  'demo.scenario': 'Escenario',
  'demo.time': 'Hora en la isla',
  'demo.time.now': 'Ahora',
  'demo.time.sunrise': 'Amanecer',
  'demo.time.noon': 'Mediodía',
  'demo.time.sunset': 'Atardecer',
  'demo.time.night': 'Noche',
  'demo.network': 'Simular la conexión',
  'demo.slow': 'Conexión lenta',
  'demo.slow.hint': 'Para ver los estados de carga.',
  'demo.fail': 'Fallo del servicio',
  'demo.fail.hint': 'Para ver cómo se avisa de un error.',
  'demo.scenario.alisio': 'Alisio de otoño',
  'demo.scenario.alisio.text': 'Sol, alisio del nordeste y olas en el norte. El sur, en calma.',
  'demo.scenario.calma': 'Calma chicha',
  'demo.scenario.calma.text':
    'Sin apenas viento, mar como un plato y calor. Día de playa en toda la isla.',
  'demo.scenario.ventoso': 'Alisio fuerte',
  'demo.scenario.ventoso.text':
    'Viento fuerte del nordeste y mar movido. Toca buscar abrigo en el sur.',
  'demo.scenario.calima': 'Calima',
  'demo.scenario.calima.text':
    'Polvo del Sáhara, cielo blanquecino y calor seco con viento del este.',
  'demo.scenario.borrasca': 'Borrasca del suroeste',
  'demo.scenario.borrasca.text':
    'Nubes, chubascos y viento del suroeste: esta vez el sur se lleva el oleaje.',
} as const satisfies Record<string, string>;

export type MessageKey = keyof typeof es;
export type Messages = Readonly<Record<MessageKey, string>>;
