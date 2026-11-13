import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        origin: 'http://localhost:5173',
        hmr: { host: 'localhost' },
        cors: true,
        watch: {
            usePolling: true,
            interval: 1500,
            ignored: [
                '**/node_modules/**',
                '**/vendor/**',
                '**/.git/**',
                '**/storage/**',
                '**/public/**',
                '**/tests/**',
            ],
        },
    },
    plugins: [
        tailwindcss(),
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
});
