import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useOfflinePlugin } from './plugins/offline-plugin.js'
import './assets/main.css'

if (import.meta.env.DEV) {
  import('./plugins/debug-offline.js')
}

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

useOfflinePlugin()

app.mount('#app')
