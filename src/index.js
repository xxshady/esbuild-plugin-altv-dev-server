import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pluginName = 'altv-dev-server'
const __dirname = dirname(fileURLToPath(import.meta.url))
const bannerContent = readFileSync(join(__dirname, 'alt-overwrite-banner.js'))

/**
 * @returns {import('esbuild').Plugin}
 */
const altvServerDev = () => ({
  name: pluginName,
  setup (build) {
    let {
      initialOptions: {
        banner,
        outfile,
        // TODO outdir handling
        // outdir,
      },
    } = build

    const outfileName = outfile.slice(outfile[0] === '.' ? 2 : 1)

    console.log(`[${pluginName}]`, 'outfileName:', outfileName)

    const replaceStr = (str, char, replace) => {
      let newStr = ''

      for (let i = 0; i < str.length; i++) {
        newStr += str[i] === char ? replace : str[i]
      }

      return newStr
    }

    const jsBanner = (
      '\n// ----- esbuild-plugin-altv-dev-server -----\n' +
      'import ___fs from "fs";\n' +
      `const ___BUNDLE_PATH___ = "${replaceStr(__dirname, '\\', '/') + '/' + outfileName}"; \n\n` +
      bannerContent +
      '\n// ----- esbuild-plugin-altv-dev-server -----\n'
    )

    banner = banner ?? { js: '' }

    banner.js += jsBanner

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