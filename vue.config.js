module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
	pluginOptions: {
    electronBuilder: {
      // Or, for multiple preload files:
			preload: { preload: 'src/preload.js', preloadWorker: 'src/preloadWorker.js' }
    }
  }
}