<template>
  <v-app>
    <v-app-bar app color="background" dark>
      <div class="d-flex align-center">
        <h3 style="font-family:Roboto; font-weight:300;">SUPERSTATBROS</h3>
      </div>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/RaphMcGee23/superstatbros-uploader"
        target="_blank"
        text
      >
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main class="background">
      <v-container id="mainContainer" class="d-flex align-center justify-center">
        <v-row class="justify-center">
          <v-col>
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",

  data: () => ({
    //
  }),
	mounted(){
		window.ipcRenderer.on("loginCookie", (data) => {
      this.$store.commit("login", data);
    });
	}
};
</script>

<style>
#mainContainer{
	height: 100%;
}
.v-input__append-inner {
  margin: 0 !important;
}
.v-main__wrap {
  position: relative;
}
.v-main__wrap:before {
  content: " ";
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0.2;
  background-image: url("./assets/grid-me.png");
  background-repeat: initial;
	pointer-events: none;
}
</style>
