/**
 * Re-export for Nx versions that resolve workspace generators via
 * index.ts instead of generator.ts. The implementation lives in
 * generator.ts; this file only forwards it.
 */
export { default } from './generator';
