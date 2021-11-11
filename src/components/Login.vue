<template>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12">
            <h1 class="my-0">Log in to your account</h1>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="accountName"
              :rules="accountRules"
              label="Account name"
              name="account"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="password"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :rules="[passwordRules.required, passwordRules.min]"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              label="Password"
              hint="At least 8 characters"
              counter
              @click:append="showPassword = !showPassword"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-btn
              style="width: 100%"
              class="mb-3"
              color="tertiary"
              :disabled="!valid"
              @click="login"
              >LOGIN</v-btn
            >
            <v-divider></v-divider>
            <p v-if="response" style="font-weight: bold">{{ this.response }}</p>
          </v-col>

          <v-col cols="12">
            <p>
              Don't have an account?
              <router-link to="/register" color="indigo lighten-4"
                >Sign up</router-link
              >
            </p>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
</template>

<script>
const axios = require('axios');
axios.defaults.baseURL = "https://superstatbros.com";
export default {
  name: "Login",
  data: () => ({
		response: null,
    valid: false,
    accountName: "",
    password: "",
		showPassword: false,
    accountRules: [
      (v) => !!v || "Account name is required",
      (v) => v.length >= 3 || "Name must be more than 3 characters.",
    ],
    passwordRules: {
      required: (value) => !!value || "Required.",
      min: (v) => v.length >= 8 || "Min 8 characters",
    },
  }),
	methods: {
		login(){
			if(this.valid){
				axios({
					method: "post",
					url: "/login",
					data: {
						accountName: this.accountName.toLowerCase(),
						password: this.password.toLowerCase()
					}
				}).then(res => {
					if(res.data === "Username or password incorrect!"){
						this.response = res.data;
					}else{
						window.ipcRenderer.send('setCookie', res.data);
						this.$store.commit('login', res.data);
						this.$router.push('/');
					}
				}).catch(err => {
					console.log(err);
				})
			}
		}
	}
};
</script>