const { workerData, parentPort } = require('worker_threads');
const { SlippiGame } = require('@slippi/slippi-js');
const crypto = require('crypto');
const semver = require('semver');


function parse(path) {
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

parentPort.postMessage(
	parse(workerData.value)
);