import { defineConfig } from 'astro/config';
import enhanceLog from '../../src'
import inspect from 'vite-plugin-inspect'
// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [enhanceLog({
      splitBy: '\n'
    }), inspect()]
  }
});
