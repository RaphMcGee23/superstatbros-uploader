const { contextBridge, ipcRenderer } = require('electron');
const { SlippiGame } = require('@slippi/slippi-js');
const crypto = require('crypto');
const semver = require('semver');

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld('ipcRenderer', {
	send: (channel, data) => {
		let validChannels = ['worker-log', "parseSlpWorker-reply"] // <-- Array of all ipcRenderer Channels used in the client
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data)
		}
	},
	on: (channel, func) => {
		let validChannels = ['log', "parseSlpWorker"] // <-- Array of all ipcMain Channels used in the electron
		if (validChannels.includes(channel)) {
			// Deliberately strip event as it includes `sender`
			ipcRenderer.on(channel, (event, ...args) => func(...args))
		}
	}
})

contextBridge.exposeInMainWorld('slippiGame', {
	parse: (path) => {
		let match = {};
		const game = new SlippiGame(path);
		const settings = game.getSettings();
		if(semver.lt(settings.slpVersion, '3.6.0')){
			return "Slippi version: " + settings.slpVersion + ". Requires 3.6.0 or higher.";
		}
		const metadata = game.getMetadata();
		const stats = game.getStats();
		const id = crypto.createHash("md5").update(`${settings.players[0].characterId}_${settings.players[0].characterColor}_${settings.players[1].characterId}_${settings.players[1].characterColor}_${settings.gameMode}_${settings.stageId}_${metadata.lastFrame}_${settings.players[0].connectCode}_${settings.players[1].connectCode}`).digest('hex');
		if (settings.isTeams == true) {
			return "Teams slp file not supported.";
		}
		match.settings = settings;
		match.stats = stats;
		match.metadata = metadata;
		match.id = id;
		return match;
	}
});