import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// export default defineConfig({
//   plugins: [solidPlugin()],
//   server: {
//     port: 3000,
//   },
//   build: {
//     target: 'esnext',
//   },
// });
export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    watch: {
      usePolling: true
    },
    host: true,
    strictPort: true,
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});