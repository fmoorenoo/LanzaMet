import {
  ArrowDown,
  ArrowUp,
  Bug,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplet,
  Footprints,
  type IconNode,
  Info,
  Languages,
  Lightbulb,
  LoaderCircle,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  MessageSquareHeart,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  TriangleAlert,
  Wind,
  X,
} from 'lucide';

/*
 * One icon system on a 24px grid with round caps and joins, drawn at a 1.75
 * stroke (see Icon).
 *
 *  · Interface icons come from Lucide (ISC licence), imported one by one so
 *    only the icons used here reach the bundle.
 *  · The app's own icons stay where they carry its identity or Lucide has
 *    nothing as precise: "Hoy" (the sun over the horizon), the sea and its
 *    waves, the tide rising and falling, the beach parasol, the swimmer and
 *    the surfer. They are drawn to Lucide's grid and stroke.
 *
 * The weather glyphs (SkyGlyph), the brand mark and the scene are separate
 * illustrations and never come from here.
 */

export type IconShape = IconNode[number];

export interface IconDefinition {
  readonly shapes: readonly IconShape[];
  /** Painted solid instead of outlined (a chosen star). */
  readonly filled?: boolean;
}

const path = (d: string): IconShape => ['path', { d }];

const WAVE_ROW = (y: number) =>
  `M2 ${y}c1.7 0 2.3-1.5 4-1.5s2.3 1.5 4 1.5 2.3-1.5 4-1.5 2.3 1.5 4 1.5 2.3-1.5 4-1.5`;

const lucide = (shapes: IconNode): IconDefinition => ({ shapes });
const own = (...d: string[]): IconDefinition => ({ shapes: d.map(path) });

export const ICONS = {
  // Navigation
  today: own(
    'M3 16.5h18',
    'M7.5 16.5a4.5 4.5 0 0 1 9 0',
    'M12 9.5V7.5M7.4 11.9 6 10.5M16.6 11.9l1.4-1.4',
    'M6.5 20h11',
  ),
  zones: lucide(MapIcon),
  sea: own(WAVE_ROW(7.5), WAVE_ROW(12.5), WAVE_ROW(17.5)),
  plans: lucide(Compass),
  feedback: lucide(MessageSquareHeart),

  // Interface
  'chevron-down': lucide(ChevronDown),
  'chevron-right': lucide(ChevronRight),
  'chevron-left': lucide(ChevronLeft),
  close: lucide(X),
  search: lucide(Search),
  star: lucide(Star),
  'star-filled': { shapes: Star, filled: true },
  pin: lucide(MapPin),
  refresh: lucide(RefreshCw),
  sliders: lucide(SlidersHorizontal),
  info: lucide(Info),
  alert: lucide(TriangleAlert),
  'arrow-up': lucide(ArrowUp),
  'arrow-down': lucide(ArrowDown),
  languages: lucide(Languages),
  check: lucide(Check),
  send: lucide(Send),
  loader: lucide(LoaderCircle),
  mail: lucide(Mail),
  privacy: lucide(ShieldCheck),

  // Feedback kinds
  bug: lucide(Bug),
  idea: lucide(Lightbulb),
  sprout: lucide(Sprout),
  message: lucide(MessageCircle),

  // Conditions
  wind: lucide(Wind),
  waves: own(WAVE_ROW(10), WAVE_ROW(15.5)),
  'tide-up': own(WAVE_ROW(18), 'M12 13.5V4.5M8.5 8 12 4.5 15.5 8'),
  'tide-down': own(WAVE_ROW(18), 'M12 4.5v9M8.5 10l3.5 3.5 3.5-3.5'),
  sunrise: lucide(Sunrise),
  sunset: lucide(Sunset),
  thermometer: lucide(Thermometer),
  drop: lucide(Droplet),
  sun: lucide(Sun),

  // Plans
  beach: own('M3.5 12a8.5 8.5 0 0 1 17 0z', 'M12 12v8', 'M5 20.5h14'),
  shelter: lucide(Shield),
  swim: own(
    'M16 5.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z',
    'M4.5 13l4.5-3.5 3 3 4-2.2',
    WAVE_ROW(17.5),
  ),
  walk: lucide(Footprints),
  surf: own(
    'M3 17c3.2 0 5-2.4 6.4-5.6C10.9 8 12.8 5 17 5c2.3 0 3.8 1.5 3.8 3.4 0 1.8-1.4 3.1-3.1 3.1-1.4 0-2.4-1-2.4-2.3',
    'M3 20.5h18',
  ),
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;
