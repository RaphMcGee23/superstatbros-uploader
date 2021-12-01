const { contextBridge, ipcRenderer } = require('electron');
const { SlippiGame } = require('@slippi/slippi-js');
const crypto = require('crypto');
const semver = require('semver');
const path = require('path');

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld('ipcRenderer', {
	send: (channel, data) => {
		let validChannels = ['worker-log', "parseSlpWorker-reply", "parseSlpUpload-reply"] // <-- Array of all ipcRenderer Channels used in the client
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data)
		}
	},
	on: (channel, func) => {
		let validChannels = ['log', "parseSlpWorker", "parseSlpUpload"] // <-- Array of all ipcMain Channels used in the electron
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
		if(!settings){
			return "Error in generating settings.";
		}
		for(let i = 0; i < settings.players.length; i++){
			if(!settings.players[i].connectCode){
				return "No connect code in file."
			}
		}
		const metadata = game.getMetadata();
		if(!metadata){
			return "Error in generating metadata.";
		}
		const stats = game.getStats();
		if(!stats){
			return "Error in generating stats.";
		}
		if(semver.lt(settings.slpVersion, '3.6.0')){
			return "Slippi version: " + settings.slpVersion + ". Requires 3.6.0 or higher.";
		}
		if (settings.isTeams == true) {
			return "Teams slp file not supported.";
		}
		if(!settings.players[0].characterId || !settings.players[0].characterColor || !settings.players[1].characterId || !settings.players[1].characterColor || !metadata.startAt || !settings.stageI){
			return "Missing properties in SLP.";
		}
		const id = crypto.createHash("md5").update(`${settings.players[0].characterId}_${settings.players[0].characterColor}_${settings.players[1].characterId}_${settings.players[1].characterColor}_${metadata.startAt}_${settings.stageId}_${settings.players[0].connectCode}_${settings.players[1].connectCode}`).digest('hex');
		match.settings = settings;
		match.stats = stats;
		match.metadata = metadata;
		match.id = id;
		return match;
	}
});