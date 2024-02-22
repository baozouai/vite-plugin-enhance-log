import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import EnhanceLog from '../../src'

const config = defineConfig({
  plugins: [
    Vue({}),
    EnhanceLog({
      colorFileName: true,
      splitBy: '\n',
      preTip: '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥',
      enableFileName: {
        enableDir: true,
        // custom(filename) {
        //   return filename.replace(/.*?playgrounds/, '')
        // },
      },
      // endLine: true,
    }),
    Inspect(),
  ],
})

export default config
