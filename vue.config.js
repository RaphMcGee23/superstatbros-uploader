module.exports = {
	transpileDependencies: [
		'vuetify'
	],
	pluginOptions: {
		electronBuilder: {
			// Or, for multiple preload files:
			preload: { preload: 'src/preload.js', slpWorker: "src/slpWorker.js"},
			nsis: {
				oneClick: false,
				artifactName: "SUPERSTATBROS"
			},
			build: {
				appId: "com.electron.statbros"
			}
		}
	}
}
