/**
 * MexicoMap — Interactive SVG map of Mexico's 32 states
 *
 * Deps:
 *   npm install d3-geo
 *   npm install --save-dev @types/geojson
 */

import React, {
  type FC,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection } from 'geojson';
import './MexicoMap.css';

// ─── GeoJSON source ────────────────────────────────────────────────────────────
const GEOJSON_URL =
  'https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json';

// ─── SVG coordinate space ──────────────────────────────────────────────────────
const VB_W = 960;
const VB_H = 600;

// ─── Fill constants ────────────────────────────────────────────────────────────
const DEFAULT_FILL   = '#ddd8c4'; // muted parchment for non-featured states
const HIGHLIGHT_FILL = '#797853'; // brand sage — Baja California Norte & Guanajuato
const SECONDARY_FILL = '#b8b494'; // soft sage — other notable wine regions
const HOVER_FILL     = '#454411'; // brand forest on hover

const HIGHLIGHTED_STATES = new Set(['BCN', 'GUA']);
const SECONDARY_STATES   = new Set(['SON', 'COA', 'DUR', 'ZAC', 'AGU', 'QUE']);

// ─── Region info cards ─────────────────────────────────────────────────────────
const REGION_INFO: Record<string, {
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  stat: string;
}> = {
  BCN: {
    name: 'Baja California',
    subtitle: 'Valle de Guadalupe',
    description:
      "Mexico's premier wine country — warm sunny days, cool Pacific-kissed nights, and volcanic soils that yield wines of rare depth and terroir.",
    tags: ['Tempranillo', 'Nebbiolo', 'Grenache'],
    stat: '90% of Mexico\'s wine production',
  },
  GUA: {
    name: 'Guanajuato',
    subtitle: 'Sierra Gorda highlands',
    description:
      'An emerging high-altitude region at 1,700–2,100 m. Limestone soils and dramatic diurnal temperature swings craft wines of striking elegance.',
    tags: ['Syrah', 'Cabernet Franc', 'Viognier'],
    stat: '2,100 m above sea level',
  },
};

// ─── Tooltip size (used for viewport-edge clamping) ───────────────────────────
const TT_W = 190;
const TT_H = 86;

// ─── State abbreviation map ────────────────────────────────────────────────────
const ABBR: Record<string, string> = {
  AGU: 'AGS',  BCN: 'BC',   BCS: 'BCS',  CAM: 'CAMP', CHH: 'CHIH',
  CHP: 'CHIS', CMX: 'CDMX', COA: 'COAH', COL: 'COL',  DUR: 'DGO',
  GRO: 'GRO',  GUA: 'GTO',  HID: 'HGO',  JAL: 'JAL',  MEX: 'MEX',
  MIC: 'MICH', MOR: 'MOR',  NAY: 'NAY',  NLE: 'NL',   OAX: 'OAX',
  PUE: 'PUE',  QUE: 'QRO',  ROO: 'QROO', SIN: 'SIN',  SLP: 'SLP',
  SON: 'SON',  TAB: 'TAB',  TAM: 'TAMPS', TLA: 'TLAX', VER: 'VER',
  YUC: 'YUC',  ZAC: 'ZAC',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StateDataItem {
  stateCode: string;
  value: unknown;
}

export interface MexicoMapProps {
  data?: StateDataItem[];
  onStateClick?: (stateCode: string) => void;
  colorScale?: (value: unknown) => string;
  className?: string;
}

interface TooltipInfo {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  abbr: string;
  code: string;
  value: unknown;
}

interface ArrowPoints {
  sx: number; sy: number; // source — state centroid
  ex: number; ey: number; // end   — card left-edge center
}

// ─── Feature helpers ───────────────────────────────────────────────────────────

function stateCode(f: Feature): string {
  const id = (f.properties as Record<string, unknown>)['id'] as string ?? '';
  return id.replace(/^MX-/, '');
}

function stateName(f: Feature): string {
  return ((f.properties as Record<string, unknown>)['name'] as string) ?? '';
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const MexicoMap: FC<MexicoMapProps> = ({
  data = [],
  onStateClick,
  colorScale,
  className,
}) => {
  const [features, setFeatures]     = useState<Feature[]>([]);
  const [status, setStatus]         = useState<'loading' | 'ready' | 'error'>('loading');
  const [fetchError, setFetchError] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip]       = useState<TooltipInfo>({
    visible: false, x: 0, y: 0, name: '', abbr: '', code: '', value: null,
  });
  const [arrowBCN, setArrowBCN] = useState<ArrowPoints | null>(null);
  const [arrowGUA, setArrowGUA] = useState<ArrowPoints | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const bcnCardRef   = useRef<HTMLDivElement>(null);
  const guaCardRef   = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setStatus('loading');

    fetch(GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<FeatureCollection>;
      })
      .then((fc) => {
        if (!alive) return;
        setFeatures(fc.features ?? []);
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (!alive) return;
        setFetchError(e.message);
        setStatus('error');
      });

    return () => { alive = false; };
  }, []);

  // ── Data lookup map ───────────────────────────────────────────────────────────
  const dataMap = useMemo(() => {
    const m = new Map<string, unknown>();
    data.forEach(({ stateCode: code, value }) => m.set(code, value));
    return m;
  }, [data]);

  // ── D3 path generator ─────────────────────────────────────────────────────────
  const pathFn = useMemo(() => {
    if (!features.length) return null;
    const collection: FeatureCollection = { type: 'FeatureCollection', features };
    const proj = geoMercator().fitSize([VB_W, VB_H], collection);
    return geoPath(proj);
  }, [features]);

  // ── Centroids of highlighted states in viewBox space ──────────────────────────
  const centroids = useMemo((): Partial<Record<string, [number, number]>> => {
    if (!pathFn || !features.length) return {};
    const out: Partial<Record<string, [number, number]>> = {};
    features.forEach((f: Feature) => {
      const code = stateCode(f);
      if (HIGHLIGHTED_STATES.has(code)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = pathFn.centroid(f as any);
        if (c && !isNaN(c[0])) out[code] = c as [number, number];
      }
    });
    return out;
  }, [pathFn, features]);

  // ── Arrow coordinate computation ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;

    const compute = () => {
      const container = containerRef.current;
      const svg       = svgRef.current;
      const bcnCard   = bcnCardRef.current;
      const guaCard   = guaCardRef.current;
      if (!container || !svg || !bcnCard || !guaCard) return;
      if (!centroids.BCN || !centroids.GUA) return;

      const cr  = container.getBoundingClientRect();
      const sr  = svg.getBoundingClientRect();
      const scX = sr.width  / VB_W;
      const scY = sr.height / VB_H;
      const ox  = sr.left - cr.left;
      const oy  = sr.top  - cr.top;

      const toContainer = (vx: number, vy: number) => ({
        x: ox + vx * scX,
        y: oy + vy * scY,
      });

      const cardAnchor = (el: HTMLDivElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - cr.left, y: r.top - cr.top + r.height / 2 };
      };

      const [bcnVx, bcnVy] = centroids.BCN;
      const [guaVx, guaVy] = centroids.GUA;
      const bcnSrc = toContainer(bcnVx, bcnVy);
      const guaSrc = toContainer(guaVx, guaVy);
      const bcnEnd = cardAnchor(bcnCard);
      const guaEnd = cardAnchor(guaCard);

      setArrowBCN({ sx: bcnSrc.x, sy: bcnSrc.y, ex: bcnEnd.x, ey: bcnEnd.y });
      setArrowGUA({ sx: guaSrc.x, sy: guaSrc.y, ex: guaEnd.x, ey: guaEnd.y });
    };

    const t = setTimeout(compute, 60);
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [centroids, status]);

  // ── Tooltip positioning ───────────────────────────────────────────────────────
  const placeTooltip = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left + 14;
    let y = clientY - rect.top  + 14;
    if (x + TT_W > rect.width  - 8) x = clientX - rect.left - TT_W - 10;
    if (y + TT_H > rect.height - 8) y = clientY - rect.top  - TT_H - 10;
    setTooltip((t) => ({ ...t, x, y }));
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, f: Feature, idx: number) => {
      const code  = stateCode(f);
      const name  = stateName(f);
      const abbr  = ABBR[code] ?? code;
      const value = dataMap.get(code) ?? null;
      setHoveredIdx(idx);
      setTooltip({ visible: true, x: 0, y: 0, name, abbr, code, value });
      placeTooltip(e.clientX, e.clientY);
    },
    [dataMap, placeTooltip],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => placeTooltip(e.clientX, e.clientY),
    [placeTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIdx(null);
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  const handleClick = useCallback(
    (f: Feature) => onStateClick?.(stateCode(f)),
    [onStateClick],
  );

  // ── Fill resolver ─────────────────────────────────────────────────────────────
  const getFill = useCallback(
    (f: Feature, idx: number): string => {
      const code = stateCode(f);
      if (idx === hoveredIdx && HIGHLIGHTED_STATES.has(code)) return HOVER_FILL;
      if (colorScale) {
        const value = dataMap.get(code);
        if (value !== undefined) return colorScale(value);
      }
      if (HIGHLIGHTED_STATES.has(code)) return HIGHLIGHT_FILL;
      if (SECONDARY_STATES.has(code))   return SECONDARY_FILL;
      return DEFAULT_FILL;
    },
    [hoveredIdx, colorScale, dataMap],
  );

  // ── Arrow path builder ────────────────────────────────────────────────────────
  const buildArrowPath = (a: ArrowPoints): string => {
    const dx   = a.ex - a.sx;
    const cp1x = a.sx + dx * 0.5;
    const cp1y = a.sy;
    const cp2x = a.ex - dx * 0.2;
    const cp2y = a.ey;
    return `M ${a.sx} ${a.sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${a.ex} ${a.ey}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const clickable = Boolean(onStateClick);

  return (
    <div
      ref={containerRef}
      className={['mexmap', className].filter(Boolean).join(' ')}
      data-status={status}
    >
      {status === 'loading' && (
        <div className="mexmap__overlay" aria-live="polite">
          <span className="mexmap__spinner" aria-hidden="true" />
          <span className="mexmap__overlay-text">Loading map…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mexmap__overlay mexmap__overlay--error" role="alert">
          <span className="mexmap__overlay-title">Map failed to load</span>
          <span className="mexmap__overlay-text">{fetchError}</span>
          <span className="mexmap__overlay-hint">
            Verify the GEOJSON_URL constant in MexicoMap.tsx.
          </span>
        </div>
      )}

      {status === 'ready' && pathFn && (
        <>
          {/* ── Map + cards side-by-side layout ── */}
          <div className="mexmap__layout">

            {/* Map */}
            <div className="mexmap__map-wrap">
              <svg
                ref={svgRef}
                className="mexmap__svg"
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                aria-label="Map of Mexico showing all 32 states"
                role="img"
              >
                <g className="mexmap__states">
                  {features.map((f, i) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const d = pathFn(f as any);
                    if (!d) return null;
                    const code = stateCode(f);
                    return (
                      <path
                        key={code || i}
                        d={d}
                        data-state={code}
                        fill={getFill(f, i)}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        strokeLinejoin="round"
                        className="mexmap__path"
                        onMouseEnter={(e) => handleMouseEnter(e, f, i)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={clickable ? () => handleClick(f) : undefined}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        aria-label={stateName(f)}
                        onKeyDown={
                          clickable
                            ? (e) => e.key === 'Enter' && handleClick(f)
                            : undefined
                        }
                      />
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Region info cards */}
            <div className="mexmap__cards">
              {(['BCN', 'GUA'] as const).map((code) => {
                const info    = REGION_INFO[code];
                const cardRef = code === 'BCN' ? bcnCardRef : guaCardRef;
                return (
                  <div key={code} ref={cardRef} className="mexmap__region-card">
                    <span className="mexmap__card-label">{ABBR[code]}</span>
                    <h3 className="mexmap__card-name">{info.name}</h3>
                    <p className="mexmap__card-subtitle">{info.subtitle}</p>
                    <p className="mexmap__card-desc">{info.description}</p>
                    <div className="mexmap__card-tags">
                      {info.tags.map((tag) => (
                        <span key={tag} className="mexmap__card-tag">{tag}</span>
                      ))}
                    </div>
                    <p className="mexmap__card-stat">{info.stat}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Arrow overlay SVG ── */}
          {(arrowBCN || arrowGUA) && (
            <svg
              aria-hidden="true"
              className="mexmap__arrow-overlay"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="mexmap-arrowhead"
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 7 3.5, 0 7" fill="#797853" opacity="0.8" />
                </marker>
              </defs>

              {([
                { key: 'bcn', arr: arrowBCN },
                { key: 'gua', arr: arrowGUA },
              ] as const).map(({ key, arr }) => {
                if (!arr) return null;
                return (
                  <g key={key}>
                    {/* Pulsing ring at centroid */}
                    <circle
                      cx={arr.sx} cy={arr.sy} r={9}
                      fill="#797853"
                      className="mexmap__pulse"
                    />
                    {/* Solid dot */}
                    <circle cx={arr.sx} cy={arr.sy} r={4} fill="#797853" />
                    {/* Bezier curve arrow */}
                    <path
                      d={buildArrowPath(arr)}
                      fill="none"
                      stroke="#797853"
                      strokeWidth={1.5}
                      opacity={0.7}
                      markerEnd="url(#mexmap-arrowhead)"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* ── Tooltip ── */}
          {tooltip.visible && (
            <div
              className="mexmap__tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
              aria-hidden="true"
            >
              <p className="mexmap__tt-name">{tooltip.name}</p>
              <p className="mexmap__tt-abbr">{tooltip.abbr}</p>
              <p className={`mexmap__tt-value${tooltip.value === null ? ' mexmap__tt-value--empty' : ''}`}>
                {tooltip.value !== null ? String(tooltip.value) : '—'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MexicoMap;
