import { defineConfig } from 'astro/config'
import inspect from 'vite-plugin-inspect'
import enhanceLog from '../../src'

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [enhanceLog({
      splitBy: '\n',
      endLine: true,
    }), inspect()],
  },
})
