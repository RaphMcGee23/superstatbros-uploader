import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
		loggedIn: false,
		token: null,
  },
  mutations: {
		login(state,data){
			state.token = data;
			state.loggedIn = true;
		},
  },
  actions: {
  },
  modules: {
  }
})
