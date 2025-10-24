// Ambient declaration for `busboy` to satisfy TypeScript in this workspace.
// This is a minimal shim; for stricter typing, install or create proper type definitions.
declare module "busboy" {
  export type BusboyConfig = {
    headers?: Record<string, string>;
    limits?: unknown;
  };
  export type BusboyFileInfo = {
    filename?: string;
    mimeType?: string;
  };
  export default function busboy(config?: BusboyConfig): unknown;
}
