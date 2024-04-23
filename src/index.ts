import traverse from '@babel/traverse'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import type { ConfigEnv, PluginOption, UserConfig } from 'vite'
import { createFilter } from 'vite'
import type { StringLiteral } from '@babel/types'
import { SourceMapConsumer } from 'source-map'
import type { RawSourceMap } from 'source-map'

function stringLiteral(value: string) {
  const stringLiteralNode: StringLiteral = {
    type: 'StringLiteral',
    value,
  }
  return stringLiteralNode
}

function isObj(obj: any): obj is object {
  return obj && typeof obj === 'object'
}
export type EnableFileName = boolean | {
  /**
   * @default true
   * @example
   * the file name path is src/index.ts
   * if enableDir is true, the log will be src/index.ts
   * if enableDir is false, the log will be index.ts
   */
  enableDir?: boolean
  /**
   * @example
   * filename: /Users/xxx/code/your-project/packages/main/src/index.ts
   * root: /Users/xxx/code/your-project/packages/main
   * rootSplitExp: /(.*?)packages
   * the log will be main/src/index.ts
   */
  custom?: (filename: string) => string
}
export interface Options {
  /** apply plugin in which mode, default all */
  apply?: 'serve' | 'build' | ((this: void, config: UserConfig, env: ConfigEnv) => boolean)
  /** colorful filename，but The firefox can't recognize color labels, and garbled characters appear */
  colorFileName?: boolean
  /**
   * match log method reg, default /console\.log/, you can custom
   * @example
   * logMethodReg: /console\.(log|error|warn|info|debug)/
   */
  logMethodReg?: RegExp
  /**
   * to log filename, default true
   */
  enableFileName?: EnableFileName
  /**
   * tip of start argument default 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
   * also, you can custom preTip by logMethod
   * @example
   * console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀', ...)
   * preTip: (logMethod) => {
   * if (logMethod === 'console.error') return '❌❌❌❌❌'
   * if (logMethod === 'console.warn') return '🚨🚨🚨🚨🚨'
   * if (logMethod === 'console.info') return '💡💡💡💡💡'
   * if (logMethod === 'console.debug') return '🐞🐞🐞🐞🐞'
   * return '🚀🚀🚀🚀🚀'
   * }
   */
  preTip?: string | ((logMethod: string) => string)
  /**
   * every arg split by
   * @example
   * \n
   * ;
   * ,
   */
  splitBy?: string
  /** need endLine, default false, only if startLine unequal endLine */
  endLine?: boolean
}

const colorGreen = '\x1B[32m'
const colorBlue = '\x1B[34m'
const colorReset = '\x1B[0m'

function handleStartFileNameTip(filePath: string, lineNumber: number) {
  if (!filePath)
    return ''
  return ` ~ ${colorGreen}${filePath}:${colorBlue}${lineNumber}${colorReset}`
}

function handleFileNameTip(filePath: string, lineNumber: number) {
  if (!filePath)
    return ''
  return ` ~ ${filePath}:${lineNumber}`
}

function generateStrNode(str: string): StringLiteral & { skip: boolean } {
  const node = stringLiteral(str)

  // @ts-ignore
  node.skip = true

  // @ts-ignore
  return node
}

const DEFAULT_PRE_TIP = '🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀'

export default function enhanceLogPlugin(options: Options = {}): PluginOption {
  const {
    apply,
    colorFileName,
    logMethodReg = /console\.log/,
    preTip = DEFAULT_PRE_TIP,
    splitBy = '',
    enableFileName = true,
    endLine: enableEndLine = false,
  } = options
  const splitNode = generateStrNode(splitBy)
  let root = ''
  const filter = createFilter(
    [/\.[jt]sx?$/, /\.vue$/, /\.svelte$/, /\.astro$/],
    [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )

  function generateLineOfTip(relativeFilename: string, lineNumber: number, preTip: string) {
    return `${relativeFilename ? '' : `line of ${lineNumber} `}${preTip}`
  }
  return {
    name: 'enhance-log',
    configResolved(config) {
      root = config.root
    },
    apply,
    enforce: 'post',
    async transform(code, id) {
      if (!filter(id))
        return
      const rawSourcemap = this.getCombinedSourcemap()
      const ast = parse(code, {
        sourceType: 'unambiguous',
        sourceFilename: id,
        plugins: ['importAssertions'],
      })
      const consumer = await new SourceMapConsumer(rawSourcemap as RawSourceMap)

      traverse(ast, {
        CallExpression(path) {
          const calleeCode = generate(path.node.callee).code
          if (logMethodReg.test(calleeCode)) {
            const nodeArguments = path.node.arguments
            for (let i = 0; i < nodeArguments.length; i++) {
              const argument = nodeArguments[i]
              // @ts-ignore
              if (argument.skip)
                continue
              if (!argument.type.endsWith('Literal')) {
                if (argument.type === 'Identifier' && argument.name === 'undefined') {
                  nodeArguments.splice(i + 1, 0, splitNode)
                  continue
                }
                // @ts-ignore
                argument.skip = true
                const node = generateStrNode(`${generate(argument).code} =`)

                nodeArguments.splice(i, 0, node)
                nodeArguments.splice(i + 2, 0, splitNode)
              }
              else {
                nodeArguments.splice(i + 1, 0, splitNode)
              }
            }
            // the last needn't split
            if (nodeArguments[nodeArguments.length - 1] === splitNode)
              nodeArguments.pop()

            const { loc } = path.node
            if (loc) {
              let startLine = null
              const { line, column } = loc.start
              const { line: originStartLine } = consumer.originalPositionFor({
                line,
                column,
              }) || {}
              startLine = originStartLine

              let relativeFilename = ''

              if (enableFileName) {
                const splitId = id.split('?')[0]
                if (isObj(enableFileName) && typeof enableFileName.custom === 'function') {
                  relativeFilename = enableFileName.custom(splitId)
                }
                else {
                  relativeFilename = splitId.replace(`${root}/`, '')
                  if (isObj(enableFileName) && !enableFileName.enableDir)
                    relativeFilename = relativeFilename.replace(/.*\//, '')
                }
              }
              let newPreTip = preTip
              if (typeof preTip === 'function')
                newPreTip = preTip(calleeCode)
              const startLineTipNode = stringLiteral(`${generateLineOfTip(relativeFilename, startLine!, newPreTip as string)}${(colorFileName ? handleStartFileNameTip : handleFileNameTip)(relativeFilename, startLine!)}\n`)
              nodeArguments.unshift(startLineTipNode)
              if (enableEndLine) {
                const { line, column } = loc.end
                const { line: endLine } = consumer.originalPositionFor({
                  line,
                  column,
                }) || {}
                // if startLine === endLine, needn't log endLine
                if (startLine === endLine)
                  return
                const endLineTipNode = stringLiteral(`\n${generateLineOfTip(relativeFilename, endLine!, newPreTip as string)}${handleFileNameTip(relativeFilename, endLine!)}\n`)
                nodeArguments.push(endLineTipNode)
              }
            }
          }
        },
      })

      const { code: newCode, map } = generate(ast, {
        sourceFileName: id,
        retainLines: true,
        sourceMaps: true,
      })

      return {
        code: newCode,
        map,
      }
    },
  }
}
