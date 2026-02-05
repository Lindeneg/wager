import {defineConfig} from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        include: ["src/test/api/**/*.test.ts"],
        testTimeout: 30000,
        hookTimeout: 60000,
        fileParallelism: false,
        sequence: {
            shuffle: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
