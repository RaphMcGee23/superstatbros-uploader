<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <ManualUpload />
      </v-col>
    
      <v-col cols="12">
        <LiveLog />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import LiveLog from "../components/LiveLog.vue";
import ManualUpload from "../components/ManualUpload.vue";
export default {
  name: "Home",
  components: {
    LiveLog,
    ManualUpload,
  },
  computed: {
    loggedIn() {
      return this.$store.state.loggedIn;
    },
  },
  created() {
    if (!this.loggedIn) {
      this.$router.push("/login");
    }
  },
  methods: {},
};
</script>

<style scoped>
</style>
