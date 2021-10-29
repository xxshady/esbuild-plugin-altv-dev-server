import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pluginName = 'altv-dev-server'
const __dirname = dirname(fileURLToPath(import.meta.url))
const bannerContent = readFileSync(join(__dirname, 'alt-overwrite-banner.js'))

/**
 * @returns {import('esbuild').Plugin}
 */
const altvServerDev = (disableBanner = false) => ({
  name: pluginName,
  setup (build) {
    let { initialOptions: { banner } } = build

    const jsBanner = (
      '\n// ----- esbuild-plugin-altv-dev-server -----\n' +
      bannerContent +
      '\n// ----- esbuild-plugin-altv-dev-server -----\n'
    )

    banner = banner ?? { js: '' }

    if(!disableBanner) banner.js += jsBanner

    build.initialOptions.banner = banner

    build.onResolve({ filter: /^alt-server$/ }, (args) => ({
      path: args.path,
      namespace: pluginName,
    }))

    build.onLoad({ filter: /.*/, namespace: pluginName }, () => {
      return { contents: 'module.exports = alt' }
    })
  },
})

export default altvServerDev
