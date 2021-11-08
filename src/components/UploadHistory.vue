<template>
  <v-list v-if="games" dense>
    <v-list-group
      v-for="item in items"
      :key="item.title"
      v-model="item.active"
      :prepend-icon="item.action"
      no-action
    >
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title v-text="item.title"></v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item v-for="game in games" :key="game._id">
        <v-list-item-content>
          <v-list-item-title>{{game.settings.players[0].connectCode}} VS {{game.settings.players[1].connectCode}} </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script>
  export default {
		name: "UploadHistory",
		props: ["games"],
    data: () => ({
      items: [
        {
          action: 'mdi-gamepad-square-outline',
          title: 'Games uploaded',
        },
      ],
    }),
  }
</script>

<style scoped>
</style>