import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/auth": { target: "http://localhost:3000", changeOrigin: true },
      "/users": { target: "http://localhost:3000", changeOrigin: true },
      "/listings": { target: "http://localhost:3000", changeOrigin: true },
      "/disputes": { target: "http://localhost:3000", changeOrigin: true },
      "/conversations": { target: "http://localhost:3000", changeOrigin: true },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
})