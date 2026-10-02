import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* // https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(),react()],
})
*/
 
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target:'https://backend-focus-seu6.onrender.com/api',
        changeOrigin: true,
        secure: false,
        
      },
    },
  },
});
 