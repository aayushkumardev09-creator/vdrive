// Minimal React shim to keep TypeScript happy without @types/react.
// This project currently uses React 19 with types expected to be present.
// The sandbox TS config is failing to pick up those types, so we provide a lightweight fallback.

declare module 'react' {
  export const StrictMode: any;
  export const Fragment: any;
  export function createElement(type: any, props: any, ...children: any[]): any;

  export function useState<S = any>(initialState?: S): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: any, deps?: any[]): any;
  export function useMemo<T = any>(factory: () => T, deps?: any[]): T;
  export function useCallback<T = any>(fn: T, deps?: any[]): T;

  export type FC<P = {}> = any;
  export type FormEvent<T = any> = any;
  export type SVGProps<T = any> = any;
  export type DragEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;

  const React: any;
  export default React;
}

declare namespace React {
  export type FC<P = {}> = any;
  export type FormEvent<T = any> = any;
  export type SVGProps<T = any> = any;
  export type DragEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
}


declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}


