import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __GROWT_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: 'growt-build-version',
      generateBundle() {
        this.emitFile({
          fileName: 'app-version.json',
          source: JSON.stringify({ buildId }),
          type: 'asset',
        })
      },
    },
  ],
})
