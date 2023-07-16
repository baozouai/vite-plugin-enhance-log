import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react-swc'
import Inspect from 'vite-plugin-inspect'
import EnhanceLog from '../../src'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    EnhanceLog({
      splitBy: '\n',
      preTip: '🐖🐖🐖🐖🐖🐖🐖🐖🐖',
      enableFileName: {
        enableDir: false,
      },
    }),
    react(),

    Inspect(),
  ],
})
