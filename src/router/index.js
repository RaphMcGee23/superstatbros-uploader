import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
	{
		path: '/login',
		name: "Login",
		component: () => import('../components/Login.vue')
	},
	{
		path: '/register',
		name: "Register",
		component: () => import('../components/Register.vue')
	}
]

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
