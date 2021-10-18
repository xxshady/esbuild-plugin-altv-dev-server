import { build } from 'esbuild'
import altvServerDev from 'esbuild-plugin-altv-dev-server'

build({
  watch: true,
  bundle: true,
  target: 'esnext',
  logLevel: 'info',
  format: 'esm',
  entryPoints: ['./src/main.ts'],
  outfile: './server-dist.js',
  plugins: [
    altvServerDev(),
  ],
})