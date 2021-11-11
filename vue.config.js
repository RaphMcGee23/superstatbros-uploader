module.exports = {
	transpileDependencies: [
		'vuetify'
	],
	pluginOptions: {
		electronBuilder: {
			// Or, for multiple preload files:
			preload: { preload: 'src/preload.js', slpWorker: "src/slpWorker.js"},
			builderOptions: {
				extraFiles: [
					{
						"from": "src/slpWorker.js",
						"to": "src/slpWorker.js"
					},{
						"from": "node_modules",
						"to": "node_modules"
					},
				]
			}
		}
	}
}
