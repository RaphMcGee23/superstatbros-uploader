<template>
		<LiveLog />
</template>

<script>
import LiveLog from '../components/LiveLog.vue';
export default {
  name: "Home",
  components: {
		LiveLog
	},
	computed: {
		loggedIn(){
			return this.$store.state.loggedIn;
		},
	},
	created(){
		if(!this.loggedIn){
			this.$router.push('/login');
		}
	},
	methods: {
	}
};
</script>

<style scoped>
</style>
