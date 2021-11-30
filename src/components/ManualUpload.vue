<template>
  <v-container>
		<h1>Manual upload</h1>
		<strong>Choose a directory to upload.</strong>
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
		<v-btn
          :disabled="!folderPath"
          :loading="uploadDialog"
          class=""
          color="tertiary"
          @click="upload()"
					width="100%"
        >
        Upload
        </v-btn>
        <v-dialog v-model="uploadDialog" hide-overlay persistent width="300">
          <v-card color="tertiary lighten--4" dark>
            <v-card-text class="py-5">
              <strong>Uploading files...</strong>
							<strong class="float-right">{{this.uploadedCounter}} / {{this.filesToUpload}}</strong>
              <v-progress-linear
                v-model="uploadPercent"
                buffer-value="100"
                color="green"
                class="mb-0"
                height="40px"
              >
                <strong>{{ uploadPercent }}%</strong>
              </v-progress-linear>
							<v-btn
								v-if="uploadedCounter < filesToUpload"
                class="mx-0 my-2"
                width="100%"
                @click="cancelUpload"
								dark
								color="tertiary lighten-2"
                >Cancel</v-btn>
              <v-btn
								v-else
                class="mx-0 my-2"
                width="100%"
                :disabled="uploadPercent != 100"
                @click="closeModal"
								dark
								color="tertiary lighten-2"
                >Close</v-btn
              >
            </v-card-text>
          </v-card>
        </v-dialog>
  </v-container>
</template>

<script>

export default {
  name: "ManualUpload",
	components: {

	},
  data() {
    return {
      folder: null,
      folderPath: null,
			uploadDialog: false,
			uploadedCounter: 0,
			filesToUpload: 0,
    };
  },
  mounted() {
    window.ipcRenderer.on("folderPathManual", (data) => {
      this.folder = data;
      this.folderPath = data.filePaths[0];
    });
		window.ipcRenderer.on("upload-reply", () => {
      this.uploadedCounter++;
    });
		window.ipcRenderer.on("uploadInfo-reply", (data) => {
			if(!data){
				this.uploadDialog = true;
				this.filesToUpload = 1;
				this.uploadedCounter = 1;
			}else{
				this.uploadDialog = true;
				this.filesToUpload = data;
			}
		});
  },
	computed: {
		token(){
			return this.$store.state.token;
		},
		uploadPercent() {
      if (this.filesToUpload == 0) {
        return 0;
      }
      return Math.round((this.uploadedCounter / this.filesToUpload) * 100);
    },
	},
  methods: {
    selectFolder() {
      window.ipcRenderer.send("openDialogManual");
    },
		upload(){
			// window.ipcRenderer.send("upload", {path:this.folderPath,token:this.token});
			window.ipcRenderer.send("manualUpload",  {path:this.folderPath,token:this.token});
		},
		closeModal() {
      this.uploadDialog = false;
			this.uploadedCounter = 0;
			this.filesToUpload = 0;
    },
		cancelUpload(){
			window.ipcRenderer.send("cancelUpload");
			this.uploadDialog = false;
			this.uploadedCounter = 0;
			this.filesToUpload = 0;
		}
  },
};
</script>

<style scoped>

</style>