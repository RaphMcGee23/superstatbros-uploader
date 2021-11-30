<template>
  <v-container>
		<h1>Live Log</h1>
		<strong>Choose the directory where slippi files are created.</strong>
    <v-text-field
      v-model="folderPath"
      outlined
      readonly
      hint="Usually in Documents/Slippi"
    >
      <template v-slot:append>
        <v-btn class="my-2" @click="selectFolder" color="tertiary"> Choose </v-btn>
      </template>
    </v-text-field>
		<v-btn v-if="!logging" :disabled="!folder" width="100%" color="tertiary" @click="startLogging()" >
			Start logging
		</v-btn>
		<v-btn v-else width="100%" color="tertiary" @click="stopLogging()">
			Stop logging
		</v-btn>
		<UploadHistory v-if="this.games.length > 0" :games="this.games"/>
  </v-container>
</template>

<script>
import UploadHistory from '../components/UploadHistory.vue';
export default {
  name: "LiveLog",
	components: {
		UploadHistory
	},
  data() {
    return {
      folder: null,
      folderPath: null,
			logging: false,
			filesUploaded: 0,
			games: []
    };
  },
  mounted() {
    window.ipcRenderer.on("folderPath", (data) => {
      this.folder = data;
      this.folderPath = data.filePaths[0];
    });
		window.ipcRenderer.on("upload-complete", (data) => {
			this.games.push(data);
		})
  },
	computed: {
		token(){
			return this.$store.state.token;
		}
	},
  methods: {
    selectFolder() {
      window.ipcRenderer.send("openDialog");
    },
		startLogging(){
			this.logging = true;
			window.ipcRenderer.send("startLogging", {path: this.folderPath, token: this.token})
		},
		stopLogging(){
			this.logging = false;
			window.ipcRenderer.send("stopLogging");
		}
  },
};
</script>

<style scoped>

</style>