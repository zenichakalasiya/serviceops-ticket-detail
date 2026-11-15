import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  // On GitHub Pages the site is served from /<repo-name>/, so the production
  // build needs that base path. Local dev (`vite`) keeps the root base.
  base: command === 'build' ? '/serviceops-ticket-detail/' : '/',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Every screen is lazy-loaded (App.tsx), so chunks are per module; this only silences the
    // size warning the biggest modules (the portal builder, the ticket drawer) still trip.
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        /* React itself changes far less often than our code, so it gets its own file: after a
           deploy a returning visitor's browser keeps it cached and only fetches what changed. */
        manualChunks(id: string) {
          if (/node_modules[\\/](\.pnpm[\\/])?(react|react-dom|scheduler)[@\\/]/.test(id)) return 'react-vendor';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    watch: {
      /* Dropping a file into the project root — a screenshot, a spec — kills the dev server:
       * the tool writing it holds a lock, Chokidar's watch() throws EBUSY on Windows, and the
       * FSWatcher error is fatal. It has happened three times.
       *
       * Tradeoff: this stops watching images everywhere, including src/assets and src/imports,
       * so replacing one of those needs a manual refresh. They are Figma exports that do not
       * change mid-session, which is a cheap price for a dev server that stays up. */
      ignored: [
        '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp',
        '**/*.zip', '**/*.pdf',
        // Reference docs and briefs live in the root and are edited outside the app.
        '**/BOM-DESIGN-SYSTEM.md', '**/SHORTCUTS.md', '**/ATTRIBUTIONS.md',
        '**/ServiceOps_Global_Search_Claude_Prompt.md',
        '**/Add Tiered Filtering to ServiceOps Global Search.md',
      ],
    },
  },
}))
