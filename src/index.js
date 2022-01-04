import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pluginName = 'altv-dev-server'
const __dirname = dirname(fileURLToPath(import.meta.url))
const bannerContent = readFileSync(join(__dirname, 'alt-overwrite-banner.js'))
const consoleBlueColor = '\x1b[34m'
const consoleResetColor = '\x1b[0m'

/**
 * @returns {import('esbuild').Plugin}
 */
const altvServerDev = (options = {}) => ({
  name: pluginName,
  setup (build) {
    const {
      hotReload = false,
      handleStartupErrors = hotReload,
    } = options

    log('hotReload:', hotReload, 'handleStartupErrors:', handleStartupErrors)

    let {
      initialOptions: {
        banner,
        footer,
        outfile,
        entryPoints,
        outdir,
      },
    } = build

    let hotReloadCode = ''
    let startupErrorsHandlingBanner = ''
    let startupErrorsHandlingFooter = ''

    if (hotReload) {
      let outfileName

      if (outdir) {
        const [entry] = entryPoints

        if (entry.startsWith('./')) {
          outfileName = entry.slice(2)
        } else {
          outfileName = entry
        }
      } else {
        if (outfile.startsWith('./')) {
          outfileName = outfile.slice(2)
        } else {
          outfileName = outfile
        }
      }

      // log('outfileName:', outfileName)

      const bundlePath = replaceStringChar(process.cwd(), '\\', '/') + '/' + outfileName
      // log('bundlePath:', bundlePath)

      hotReloadCode = generateHotReloadCode(bundlePath)
    }

    if (handleStartupErrors) {
      startupErrorsHandlingBanner = 'try {\n'
      startupErrorsHandlingFooter = (
        '\n' +
        '} catch (e) {\n' +
        '  alt.nextTick(() => {\n' +
        '    alt.logError(e.stack)\n' +
        `    alt.logError('[${pluginName}] Failed to load resource', alt.resourceName)\n` +
        '  })\n' +
        '}'
      )
    }

    const jsBanner = (
      '\n// --------------------- esbuild-plugin-altv-dev-server ---------------------\n' +
      hotReloadCode +
      startupErrorsHandlingBanner +
      bannerContent +
      '\n// --------------------- esbuild-plugin-altv-dev-server ---------------------\n'
    )

    const jsFooter = (
      startupErrorsHandlingFooter
    )

    banner = banner ?? { js: '' }
    banner.js += jsBanner
    build.initialOptions.banner = banner

    footer = footer ?? { js: '' }
    footer.js += jsFooter
    build.initialOptions.footer = footer

    build.onResolve({ filter: /^alt-server$/ }, (args) => ({
      path: args.path,
      namespace: pluginName,
    }))

    build.onLoad({ filter: /.*/, namespace: pluginName }, () => {
      return { contents: 'module.exports = alt' }
    })
  },
})

function generateHotReloadCode (bundlePath) {
  const upperCasePluginName = replaceStringChar(pluginName, '-', '_').toUpperCase()

  return (
    `import ___${upperCasePluginName}_HR_FS___ from "fs"\n` +
    `const ___${upperCasePluginName}_HR_BUNDLE_PATH___ = "${bundlePath}"\n\n`
  )
}

function replaceStringChar (str, char, replace) {
  let newStr = ''

  for (let i = 0; i < str.length; i++) {
    newStr += str[i] === char ? replace : str[i]
  }

  return newStr
}

function log (...args) {
  console.log(`${consoleBlueColor}[${pluginName}]${consoleResetColor}`, ...args)
}

export default altvServerDev