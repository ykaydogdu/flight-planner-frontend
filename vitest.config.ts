import { defineConfig } from 'vitest/config'

import path from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: ['node_modules', 'dist'],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
    },
})