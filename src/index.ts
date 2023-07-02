import traverse from '@babel/traverse'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import * as t from '@babel/types'
import type { PluginOption } from 'vite'
import { createFilter } from 'vite'
import type { StringLiteral } from '@babel/types'

export type EnableFileName = boolean | {
  /**
   * @default true
   * @example
   * the file name path is src/index.ts
   * if enableDir is true, the log will be src/index.ts
   * if enableDir is false, the log will be index.ts
   */
  enableDir?: boolean
}
export interface Options {
  // /**
  //  * tip of start argument default 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
  //  * @example
  //  * console.log('line of 1 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀', ...)
  //  */
  // preTip?: string
  /**
   * to log filename, default false
   */
  enableFileName?: EnableFileName
  /**
   * tip of start argument default 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
   * @example
   * console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀', ...)
   */
  preTip?: string
  /**
   * every arg split by
   * @example
   * \n
   * ;
   * ,
   */
  splitBy?: string
  // /** need endLine, default false */
  // endLine?: boolean
  // /**
  //  * Rules to include transforming target.
  //  *
  //  * @default [/\.[jt]sx?$/, /\.vue$/]
  //  */
  // include?: FilterPattern

  // /**
  //  * Rules to exclude transforming target.
  //  *
  //  * @default [/node_modules/, /\.git/]
  //  */
  // exclude?: FilterPattern
}

function generateStrNode(str: string): StringLiteral & { skip: boolean } {
  const node = t.stringLiteral(str)

  // @ts-ignore
  node.skip = true

  // @ts-ignore
  return node
}

const DEFAULT_PRE_TIP = '🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀'
const SKIP_KEY = '@@vite-plugin-enhance-logSkip'

export default function enhanceLogPlugin(options: Options = {}): PluginOption {
  const {
    preTip = DEFAULT_PRE_TIP, splitBy = '',
    enableFileName = true,
  // endLine = false
  } = options
  const splitNode = generateStrNode(splitBy)
  let root = ''
  const filter = createFilter(
    [/\.[jt]sx?$/, /\.vue$/],
    [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )
  return {
    name: 'enhance-log',
    configResolved(config) {
      root = config.root
    },
    transform(code, id) {
      if (!filter(id))
        return

      const ast = parse(code, {
        sourceType: 'unambiguous',
      })

      traverse(ast, {
        CallExpression(path) {
          const calleeCode = generate(path.node.callee).code
          if (calleeCode === 'console.log') {
            // add comment to skip if enter next time
            const { trailingComments } = path.node
            const shouldSkip = (trailingComments || []).some((item) => {
              return item.type === 'CommentBlock' && item.value === SKIP_KEY
            })
            if (shouldSkip)
              return

            t.addComment(path.node, 'trailing', SKIP_KEY)

            const nodeArguments = path.node.arguments
            for (let i = 0; i < nodeArguments.length; i++) {
              const argument = nodeArguments[i]
              // @ts-ignore
              if (argument.skip)
                continue
              if (!t.isLiteral(argument)) {
                if (t.isIdentifier(argument) && argument.name === 'undefined') {
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
            // const { loc } = path.node
            // if (loc) {
            //   const startLine = loc.start.line
            //   const startLineTipNode = t.stringLiteral(`line of ${startLine} ${preTip}:\n`)
            //   nodeArguments.unshift(startLineTipNode)
            //   if (endLine) {
            //     const endLine = loc.end.line
            //     const endLineTipNode = t.stringLiteral(`\nline of ${endLine} ${preTip}:\n`)
            //     nodeArguments.push(endLineTipNode)
            //   }
            // }
            let startLineTip = preTip

            if (enableFileName) {
              let relativeFilename = id.replace(`${root}/`, '')
              if (typeof enableFileName === 'object' && !enableFileName.enableDir)
                relativeFilename = relativeFilename.replace(/.*\//, '')

              startLineTip += ` ~ ${relativeFilename}`
            }
            const startLineTipNode = t.stringLiteral(`${startLineTip}:\n`)
            nodeArguments.unshift(startLineTipNode)
          }
        },
      })

      const { code: newCode, map } = generate(ast, {
      })

      return {
        code: newCode,
        map,
      }
    },
  }
}
