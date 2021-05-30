import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import Menu from './views/Menu.vue'
import Game from './views/Game.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Menu },
    { path: '/game', component: Game },
  ],
})

createApp(App).mount('#app')