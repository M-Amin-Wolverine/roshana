import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import ipPlugin from './vite-plugin-ip.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  //root: './public',
  plugins: [react() , ipPlugin()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@context': path.resolve(__dirname, './src/context'),
      '@config': path.resolve(__dirname, './src/config'),
    }
  },

  assetsInclude: [
    '**/*.glb', '**/*.gltf', '**/*.fbx', '**/*.obj',
    '**/*.svg', '**/*.webp', '**/*.mp4', '**/*.webm',
    '**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'
  ],

  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom', 'axios',
      'lodash', 'zustand', '@tanstack/react-query', 'jotai','react-joyride'
    ],
    exclude: []
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]__[hash:base64:5]'
    },
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss"; @import "@/styles/mixins.scss";`,
        quietDeps: true
      }
    },
    postcss: {
      plugins: []  // حذف autoprefixer و tailwindcss
    }
  },

  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
    strictPort: false,
    https: false,
    
    // ========== اصلاح شده: حذف middleware ==========
    // middleware رو بردارید - اینجا جاش نیست
    
proxy: {
  '/api': {
    target: 'http://localhost:5000',   // مستقیم بنویس، بدون process.env,
    changeOrigin: true,
    rewrite: (path) => path,
    secure: false,
    ws: true,
    configure: (proxy, options) => {
      proxy.on('error', (err, req, res) => {
        console.log('proxy error', err);
      });
      proxy.on('proxyReq', (proxyReq, req, res) => {
        console.log('Sending Request to the Target:', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, res) => {
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
      });
    }
  },
  '/auth': {
    target: 'http://localhost:5000',   // مستقیم بنویس، بدون process.env
    changeOrigin: true,
    secure: false
  },
  '/socket': {
    target: 'http://localhost:5000',   // مستقیم بنویس، بدون process.env
    ws: true
  }
},
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
    },
    cors: true,
    hmr: {
      overlay: true
    }
  },

  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: false,
    open: false
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor'
            }
            if (id.includes('@mui') || id.includes('antd')) {
              return 'ui-vendor'
            }
            if (id.includes('lodash') || id.includes('axios') || id.includes('date-fns')) {
              return 'utils-vendor'
            }
            return 'vendor'
          }
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|svg|webp|gif)$/.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]'
          }
          return '[name]-[hash][extname]'
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    reportCompressedSize: true
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    global: 'window',
    //process: { env: {} }
  },

  envPrefix: ['VITE_', 'REACT_APP_'],
  logLevel: 'info',
  clearScreen: true
})