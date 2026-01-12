// TypeScript
// `src/types/json5-and-lforms.d.ts`

// Allow importing JSON5 files
declare module '*.json5' {
  const content: any;
  export default content;
}

// Add minimal types for the `json5` package if TS7016 occurs
declare module 'json5' {
  const JSON5: {
    parse: (text: string) => any;
    stringify?: (value: any, replacer?: any, space?: string | number) => string;
  };
  export default JSON5;
}

// Add minimal types for `lforms-loader` used in Karma
declare module 'lforms-loader/dist/lformsLoader.js' {
  export function getSupportedLFormsVersions(): Promise<string[]>;
  export function loadLForms(version: string): Promise<string>;
}
