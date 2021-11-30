<template>
	
          <v-form v-model="valid">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <h1>Create your account</h1>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="firstName"
                    :rules="nameRules"
                    :counter="20"
                    label="First name"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="lastName"
                    :rules="nameRules"
                    :counter="20"
                    label="Last name"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="email"
                    :rules="emailRules"
                    label="E-mail"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="accountName"
                    :rules="accountNameRules"
                    label="Account name"
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

                <v-col>
                  <v-btn
                    class="mb-5"
                    color="indigo lighten-4"
                    :disabled="!valid"
                    @click="signup"
                    >Sign up</v-btn
                  >
									<p v-if="response" style="font-weight:bold;">{{this.response}}</p>
                  <v-divider></v-divider>
                  <p class="my-2">
                    Already have an account?
                    <router-link to="/login">Log in now</router-link>
                  </p>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
    
</template>

<script>
const axios = require('axios');
axios.defaults.baseURL = process.env.NODE_ENV === "production" ? 'https://superstatbros.com/api' : 'http://localhost:3000';

export default {
  name: "Register",
  data: () => ({
		response: null,
    valid: false,
    firstName: "",
    lastName: "",
    showPassword: false,
    nameRules: [
      (v) => !!v || "Name is required",
      (v) => v.length <= 20 || "Name must be less than 20 characters",
    ],
    email: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+/.test(v) || "E-mail must be valid",
    ],
    accountName: "",
    accountNameRules: [
      (v) => !!v || "Account name is required",
      (v) => v.length >= 3 || "Account name must be atleast 3 characters",
    ],
    password: "",
    passwordRules: {
      required: (value) => !!value || "Required.",
      min: (v) => v.length >= 8 || "Min 8 characters",
    },
  }),
	methods: {
      signup() {
        if (this.valid) {
          axios({
              method: "post",
              url: "/register",
              data: {
                firstName: this.firstName,
                lastName: this.lastName,
                accountName: this.accountName,
                email: this.email,
                password: this.password,
              },
            })
            .then((res) => {
              if(res.data){
								this.response = res.data;
							}
            })
            .catch((err) => {
              console.log(err);
							this.response = err;
            });
        }
      },
    },
};
</script>