import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // `assistance/index.html` et `confidentialite/index.html` produisent dist/<page>/index.html :
      // /assistance/ et /confidentialite/ (URL d'assistance et de confidentialité de l'App Store)
      // sont servies par un vrai fichier, même sans la règle SPA de public/.htaccess.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        assistance: resolve(import.meta.dirname, 'assistance/index.html'),
        confidentialite: resolve(import.meta.dirname, 'confidentialite/index.html'),
      },
    },
  },
})
