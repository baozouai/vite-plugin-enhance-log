import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import EnhanceLog from '../../src'

const config = defineConfig({
  plugins: [
    Vue(),
    EnhanceLog({
      splitBy: '\n',
      preTip: '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥',
      enableFileName: true,
      endLine: true,
    }),
    Inspect(),
  ],
})

export default config
