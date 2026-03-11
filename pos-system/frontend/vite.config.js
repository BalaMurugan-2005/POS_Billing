import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        server: {
            port: 5174,
            proxy: {
                // In development, proxy /api calls to the local Spring Boot backend
                '/api': {
                    target: env.VITE_API_URL ? env.VITE_API_URL.replace('/api', '') : 'http://localhost:8081',
                    changeOrigin: true,
                }
            }
        },
        build: {
            outDir: 'dist',
            sourcemap: false,    // Disable source maps in production for security
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        charts: ['recharts'],
                        toast: ['react-hot-toast'],
                    }
                }
            }
        }
    }
})
