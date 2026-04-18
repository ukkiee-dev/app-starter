import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const port = parseInt(env.VITE_PORT) || 3000

  return {
    server: {
      port
    },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
