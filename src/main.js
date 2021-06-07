import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import installElementPlus from './plugins/element'

const app = createApp(App)
import axios from "axios";
app.config.globalProperties.$axios = axios
installElementPlus(app)
app.use(store).use(router).mount('#app')