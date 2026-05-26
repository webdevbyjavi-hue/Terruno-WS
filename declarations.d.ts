/*
 * Minimal type stubs — keeps VS Code happy while the project
 * has no node_modules. Replace with real packages when bundling:
 *   npm install react react-dom d3-geo
 *   npm install -D @types/react @types/geojson
 */

declare module 'react' {
  export type FC<P extends object = Record<string, never>> = (props: P) => any;
  export type RefObject<T> = { readonly current: T | null };
  export type MouseEvent<T = Element> = { clientX: number; clientY: number };
  export function useState<S>(init: S | (() => S)): [S, (s: S | ((p: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: readonly unknown[]): T;
  export function useRef<T>(init?: T | null): RefObject<T>;
  const _default: any;
  export default _default;
}

declare module 'd3-geo' {
  export function geoMercator(): any;
  export function geoPath(projection?: any): any;
}

declare module 'geojson' {
  export interface Feature {
    type: 'Feature';
    properties: Record<string, unknown> | null;
    geometry: unknown;
  }
  export interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
}

declare module '*.css' {
  const _: Record<string, string>;
  export default _;
}

declare namespace JSX {
  interface IntrinsicElements { [tag: string]: any; }
  type Element = any;
}
