import { build } from 'esbuild'

build({
  watch: true,
  bundle: true,
  target: 'esnext',
  logLevel: 'info',
  format: 'esm',
  entryPoints: ['./client-src/main.ts'],
  outfile: './client-dist.js',
  external: [
    'alt-*',
    'natives',
  ]
})