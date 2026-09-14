import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 💡 Módulo nativo de Node.js para manejar rutas

// Plugin para eliminar el texto de environment_details que inyecta Kilo
const removeKiloMetadata = (): Plugin => ({
  name: 'remove-kilo-metadata',
  transformIndexHtml(html) {
    return html.replace(/<environment_details>[\s\S]*?<\/environment_details>/g, '')
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), removeKiloMetadata()],
  
  /* 💡 AGREGAR CONFIGURACIÓN DE ALIAS AQUÍ */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.tunnelmole.net', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})