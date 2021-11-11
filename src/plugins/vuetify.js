import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import colors from 'vuetify/lib/util/colors';
Vue.use(Vuetify);

export default new Vuetify({
	theme: {
		dark: true,
    themes: {
      dark: {
				background: '#090f2a',
        primary: '#ffcb00',
        secondary: '#1f2659',
        tertiary: '#371962',
        error: colors.red.accent3,
      },
    },
  },
});
