import {defineConfig} from 'vite';
import {createRequire} from 'node:module';

// @motion-canvas/vite-plugin is CJS exporting { default: fn, ... }. Vite bundles this
// config with esbuild, whose CJS->ESM interop double-wraps the default export. Using
// createRequire pulls the module in its raw CJS shape so `.default` is the real factory.
const require = createRequire(import.meta.url);
const motionCanvas = require('@motion-canvas/vite-plugin').default as (
  opts?: Record<string, unknown>,
) => unknown;

// Editor (dev) previews every concept via src/project.ts. The embed build script
// overrides MC_PROJECT (one concept project file) + MC_OUTDIR (per-concept dir) and sets
// MC_EMBED=1 so @motion-canvas/core is externalized and shared with the player at runtime.
const projects = (process.env.MC_PROJECT ?? './src/project.ts').split(',');
const outDir = process.env.MC_OUTDIR ?? 'dist';
const embed = process.env.MC_EMBED === '1';

export default defineConfig({
  plugins: [motionCanvas({project: projects})],
  build: {
    outDir,
    emptyOutDir: true,
    ...(embed
      ? {rollupOptions: {external: [/^@motion-canvas\/core(\/.*)?$/]}}
      : {}),
  },
});
