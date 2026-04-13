declare module 'node:fs' {
  export const existsSync: (path: string) => boolean;
  export const mkdirSync: (path: string, options?: { recursive?: boolean }) => void;
}

declare module 'node:path' {
  export const dirname: (path: string) => string;
}
