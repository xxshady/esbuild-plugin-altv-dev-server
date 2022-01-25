import { readFileSync } from 'fs'
import nodeBuiltinModules from './node-builtin-modules'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const pluginName = 'altv-dev-server'
const __dirname = dirname(fileURLToPath(import.meta.url))
const bannerContent = readFileSync(join(__dirname, 'alt-overwrite-banner.js'))
const consoleBlueColor = '\x1b[34m'
const consoleResetColor = '\x1b[0m'
const consoleRedColor = '\x1b[31m'
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
        external,
      },
    } = build

    let hotReloadCode = ''
    let startupErrorsHandlingBanner = ''
    let startupErrorsHandlingFooter = ''
    let reconnectPlayersBanner = ''
    let externalsOnTopImports = ''

    if (hotReload) {
      const { clientPath = null } = hotReload

      let outfileName

      if (outdir) {
        const [entry] = entryPoints

        let fileName = formatPath(entry)
        const lastSlashIdx = fileName.lastIndexOf('/')

        if (lastSlashIdx !== -1) {
          fileName = fileName.slice(lastSlashIdx + 1)
        }

        outfileName = `${formatPath(outdir)}/${fileName}`
      } else {
        outfileName = formatPath(outfile)
      }

      outfileName = replaceTsExtension(outfileName)

      // log('outfileName:', outfileName)

      const cwd = replaceStringChar(process.cwd(), '\\', '/')
      const bundlePath = `${cwd}/${outfileName}`
      // log('bundlePath:', bundlePath)

      let clientFullPath = null

      if (clientPath) {
        clientFullPath = `${cwd}/${formatPath(clientPath)}`
        clientFullPath = replaceTsExtension(clientFullPath)
      }

      hotReloadCode = generateHotReloadCode(bundlePath, clientFullPath)
    }

    if (handleStartupErrors) {
      const externalsOnTopNamespace = `${pluginName}-externals-on-top`
      const { moveExternalsOnTop = true } = handleStartupErrors

      /**
       * @todo somehow improve this shit
       */

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

      if (moveExternalsOnTop) {
        const altServerIdx = external.indexOf('alt-server')
        if (altServerIdx !== '-1') external.splice(altServerIdx, 1)

        const externalRegExpString = [...external, ...Object.keys(nodeBuiltinModules)].join('|')
        const externalVarNames = {} // { [external original name]: external var name }

        for (const externalName of external) {
          if (externalName.includes('*')) {
            const errorMessage = `external name: ${externalName} "*" wildcard character is not supported yet`

            logError(errorMessage)
            logError('(this error came from plugin option handleStartupErrors.moveExternalsOnTop,')
            logError('that can be disabled if you are not using externals with enabled handleStartupErrors)')

            throw new Error(errorMessage)
          }

          const externalVarName = generateVarName(`externalOnTop_${externalName}`)

          externalVarNames[externalName] = externalVarName
          externalsOnTopImports += `import * as ${externalVarName} from "${externalName}"\n`
        }

        // TODO implement builtin modules handling

        // for (const name in nodeBuiltinModules) {
        //   const externalVarName = generateVarName(`externalOnTop_${name}`)

        //   externalVarNames[name] = externalVarName
        //   externalsOnTopImports += `import * as ${externalVarName} from "${name}"\n`
        // }

        build.onResolve(
          {
            // eslint-disable-next-line prefer-regex-literals
            filter: new RegExp(`^(${externalRegExpString})$`),
          },
          ({ path }) => {
            const externalVarName = externalVarNames[path]

            // TEST
            log(`replace external import ${path}`)

            if (!externalVarName) {
              const errorMessage = `external: ${path} var name not found`

              logError(errorMessage)
              throw new Error(errorMessage)
            }

            return {
              path: path,
              namespace: externalsOnTopNamespace,
              pluginData: externalVarName,
            }
          })

        build.onLoad({ filter: /.*/, namespace: externalsOnTopNamespace },
          ({ pluginData: externalVarName }) => {
            return {
              contents: (`
              Object.defineProperty(exports, '__esModule', { value: true })
              for (const key in ${externalVarName}) {
                exports[key] = ${externalVarName}[key]
              }
            `),
            }
          })
      }
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
      // imports first
      externalsOnTopImports +
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
  return `___${upperCasePluginName}_${varName.replace(/[-/\\ ]/g, '_')}___`
}

function replaceTsExtension (fileName) {
  if (fileName.slice(-3) === '.ts') {
    fileName = fileName.slice(0, -3) + '.js'
  }

  return fileName
}

function formatPath (path) {
  let finalPath

  if (path.startsWith('./')) finalPath = path.slice(2)
  else if (path.startsWith('/')) finalPath = path.slice(1)
  else finalPath = path

  if (path.endsWith('/')) finalPath = finalPath.slice(0, -1)

  return finalPath
}

function log (...args) {
  console.log(`${consoleBlueColor}[${pluginName}]${consoleResetColor}`, ...args)
}

function logError (...args) {
  console.log(`${consoleRedColor}[${pluginName}]`, ...args)
}

export default altvServerDev