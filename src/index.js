import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pluginName = 'altv-dev-server'
const __dirname = dirname(fileURLToPath(import.meta.url))
const bannerContent = readFileSync(join(__dirname, 'alt-overwrite-banner.js'))
const consoleBlueColor = '\x1b[34m'
const consoleResetColor = '\x1b[0m'
const upperCasePluginName = replaceStringChar(pluginName, '-', '_').toUpperCase()
const defaultReconnectPlayersDelay = 200

/**
 * @param {import('./index').IOptions} options
 * @returns {import('esbuild').Plugin}
 */
const altvServerDev = (options = {}) => ({
  name: pluginName,
  setup (build) {
    const {
      hotReload = false,
      reconnectPlayers = !!hotReload,
      handleStartupErrors = false,
    } = options

    log('hotReload:', hotReload)
    log('reconnectPlayers:', reconnectPlayers)
    log('handleStartupErrors:', handleStartupErrors)

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
    let reconnectPlayersBanner = ''

    if (hotReload) {
      const { clientPath = null } = hotReload

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

      const cwd = replaceStringChar(process.cwd(), '\\', '/')

      const bundlePath = `${cwd}/${outfileName}`
      // log('bundlePath:', bundlePath)

      let clientFullPath = null

      if (clientPath) {
        clientFullPath = `${cwd}/`

        if (clientPath.startsWith('./')) {
          clientFullPath += clientPath.slice(2)
        } else if (clientPath.startsWith('/')) {
          clientFullPath += clientPath.slice(1)
        } else {
          clientFullPath += clientPath
        }
      }

      hotReloadCode = generateHotReloadCode(bundlePath, clientFullPath)
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

    if (reconnectPlayers) {
      let delay

      if (typeof reconnectPlayers.delay === 'number') {
        delay = reconnectPlayers.delay
      } else {
        delay = defaultReconnectPlayersDelay
      }

      reconnectPlayersBanner = `const ${generateVarName('RECONNECT_PLAYERS_DELAY')} = ${delay}\n`
    }

    const jsBanner = (
      '\n// --------------------- esbuild-plugin-altv-dev-server ---------------------\n' +
      hotReloadCode +
      reconnectPlayersBanner +
      bannerContent +
      startupErrorsHandlingBanner +
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

function generateHotReloadCode (bundlePath, clientPath = null) {
  return (
    `import ${generateVarName('HR_FS')} from "fs"\n` +
    `const ${generateVarName('HR_BUNDLE_PATH')} = "${bundlePath}"\n` +
    (
      clientPath
        ? `const ${generateVarName('HR_CLIENT_PATH')} = "${clientPath}"\n`
        : ''
    )
  )
}

function replaceStringChar (str, char, replace) {
  let newStr = ''

  for (let i = 0; i < str.length; i++) {
    newStr += str[i] === char ? replace : str[i]
  }

  return newStr
}

function generateVarName (varName) {
  return `___${upperCasePluginName}_${varName}___`
}

function log (...args) {
  console.log(`${consoleBlueColor}[${pluginName}]${consoleResetColor}`, ...args)
}

export default altvServerDev