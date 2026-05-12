import { defineConfig } from 'vite'
import { execSync } from 'child_process'

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // git not available
}

export default defineConfig({
  base: '/scalade/',
  publicDir: 'static',
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  optimizeDeps: {
    exclude: ["@tensorflow/tfjs-node"],
  },
  ssr: {
    external: ["@tensorflow/tfjs-node"],
  },
})
