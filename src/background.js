'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain, session } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { exit } from 'process'
const isDevelopment = process.env.NODE_ENV !== 'production'
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar');
const fs = require('fs');
const storage = require('electron-json-storage');
// BASE URL FOR REQUESTS
axios.defaults.baseURL = process.env.NODE_ENV === "production" ? 'https://superstatbros.com/api' : 'http://localhost:3000';
let storageFolder = storage.getDataPath();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

let mainWindow, workerWindow;

async function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {

			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
			enableRemoteModule: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	workerWindow = new BrowserWindow({
		// change this to hide window
		show: false,
		width: 800,
		height: 600,
		webPreferences: {

			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
			preload: path.join(__dirname, 'preloadWorker.js')
		}
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		await workerWindow.loadURL(path.join(process.env.WEBPACK_DEV_SERVER_URL, 'worker.html'))
		if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		mainWindow.loadURL('app://./index.html')
		workerWindow.loadURL('app://./worker.html')
	}
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow()
	if (!isDevelopment) {
		mainWindow.removeMenu();
	}

	if (!fs.existsSync(storageFolder)) {
		fs.mkdirSync(storageFolder, { recursive: true });
	}
	if (!fs.existsSync(path.join(storageFolder, '/uploaded'))) {
		fs.mkdirSync(path.join(storageFolder, '/uploaded'), { recursive: true });
	}
	if (!fs.existsSync(path.join(storageFolder, '/uploaded/uploaded.json'))) {
		fs.writeFileSync(path.join(storageFolder, '/uploaded/uploaded.json'), JSON.stringify([]));
	}

	mainWindow.on('close', () => {
		app.quit();
	})
	mainWindow.once('ready-to-show', () => {
		session.defaultSession.cookies.get({ url: "http://superstatbros.com" })
			.then((cookies) => {
				mainWindow.webContents.send("loginCookie", cookies[0].value);
			}).catch((error) => {
				console.log(error)
			})
	})
})
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}

// Set cookies (for login)
ipcMain.on('setCookie', (e, data) => {
	var expiration = new Date().getTime() + 31536000;
	const cookie = { url: "http://superstatbros.com", name: "login", value: data, expirationDate: expiration };
	session.defaultSession.cookies.set(cookie)
		.then(() => {
			// success
		}, (error) => {
			console.error(error)
		})
})

// Opens dialog to select folder
ipcMain.on('openDialog', () => {
	dialog.showOpenDialog({
		properties: ["openFile", "openDirectory", "multiSelections"],
		filters: [{ extensions: ".slp" }]
	})
		.then((result) => {
			mainWindow.webContents.send('folderPath', result);
		})
		.catch((err) => {
			console.log(err);
		});
})

// Opens dialog to select folder
ipcMain.on('openDialogManual', () => {
	dialog.showOpenDialog({
		properties: ["openFile", "openDirectory", "multiSelections"],
		filters: [{ extensions: ".slp" }]
	})
		.then((result) => {
			mainWindow.webContents.send('folderPathManual', result);
		})
		.catch((err) => {
			console.log(err);
		});
})

// Start live logging
ipcMain.on('startLogging', (e, data) => {
	let watcher = chokidar.watch(path.join(data.path, '*.slp'), {
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 10000,
			pollInterval: 500
		}
	});
	console.log("Live logging started");
	watcher.on('add', (path) => {
		// Sends path to worker to parse/upload
		workerWindow.webContents.send("parseSlpWorker", { path: path, token: data.token });
	})
	// Stop live logging
	ipcMain.on("stopLogging", () => {
		watcher.close().then(() => console.log('stopped watching directory'));
	});
})

ipcMain.on('parseSlpWorker-reply', (e, data) => {
	// Upload SLP file
	axios({ method: 'post', url: '/uploads', data: { game: data.match }, headers: { "auth-token": data.token } })
		.then(function (res) {
			console.log(res.data);
			mainWindow.webContents.send("upload-complete", { settings: data.match.settings, id: data.match.id });
		})
		.catch(function (error) {
			console.log(error);
		});
})

// Used in upload view, gathers info to display in card
// ipcMain.on('upload', async (e, data) => {
// 	let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
// 	let uploadDir = fs.readdirSync(data.path).filter(file => path.extname(file) === ".slp");
// 	// compare uploaded json to upload directory
// 	let filesToUpload = uploadDir.filter(game => !uploaded.includes(game));
// 	mainWindow.webContents.send('uploadInfo-reply', filesToUpload.length);
// 	for (let i = 0; i < filesToUpload.length; i++) {
// 		workerWindow.webContents.send("parseSlpUpload", { path: path.join(data.path, filesToUpload[i]), token: data.token, name: filesToUpload[i] })
// 	}
// })

// ipcMain.on('parseSlpUpload-reply', (e, data) => {
// 	if (typeof data === String) {
// 		mainWindow.webContents.send("upload-reply");
// 	} else {
// 		// Upload SLP file
// 		axios({ method: 'post', url: '/uploads', data: { game: data.match }, headers: { "auth-token": data.token } })
// 			.then(function (res) {
// 				console.log(res.data);
// 				let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
// 				if (!uploaded.includes(data.name)) {
// 					uploaded.push(data.name);
// 					fs.writeFileSync(path.join(storageFolder, '/uploaded/uploaded.json'), JSON.stringify(uploaded));
// 				}
// 				mainWindow.webContents.send("upload-reply");
// 			})
// 			.catch(function (err) {
// 				console.log(err);
// 			});
// 	}
// })

let shouldCancel = false;
ipcMain.on('cancelUpload', () => {
	shouldCancel = true;
})

const { SlippiGame } = require('@slippi/slippi-js');
const crypto = require('crypto');
const semver = require('semver');

async function parse(path) {
	let match = {};
		const game = new SlippiGame(path);
		const metadata = game.getMetadata();
		if(!metadata){
			return "Error in generating metadata.";
		}
		for(let i = 0; i < 2; i++){
			if(!metadata.players[i].names.code){
				return "No connect code in file."
			}
		}
		const settings = game.getSettings();
		if(!settings){
			return "Error in generating settings.";
		}
		if(semver.lt(settings.slpVersion, '3.6.0')){
			return "Slippi version: " + settings.slpVersion + ". Requires 3.6.0 or higher.";
		}
		if (settings.isTeams == true) {
			return "Teams slp file not supported.";
		}
		if(settings.players[0].characterId == undefined || settings.players[0].characterColor == undefined || settings.players[1].characterId  == undefined || settings.players[1].characterColor  == undefined || !metadata.startAt || !settings.stageId){
			console.log(`
			
			player 1 character id: ${settings.players[0].characterId}
			player 1 character color: ${settings.players[0].characterColor}

			player 2 character id: ${settings.players[1].characterId}
			player 2 character color: ${settings.players[1].characterColor}

			startAt: ${metadata.startAt}
			stageId: ${settings.stageId}
			`)
			return "Missing properties in SLP.";
		}
		const gameEnd = game.getGameEnd();
		const stats = game.getStats();
		if(!stats){
			return "Error in generating stats.";
		}
		const id = crypto.createHash("md5").update(`${settings.players[0].characterId}_${settings.players[0].characterColor}_${settings.players[1].characterId}_${settings.players[1].characterColor}_${metadata.startAt}_${settings.stageId}_${metadata.players[0].names.code}_${metadata.players[1].names.code}`).digest('hex');
		match.settings = settings;
		match.stats = stats;
		match.metadata = metadata;
		match.id = id;
		match.gameEnd = gameEnd;
		return match;
}

// Manual upload
ipcMain.on("manualUpload", async (event, data) => {
	shouldCancel = false;
	let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
	let uploadDir = fs.readdirSync(data.path).filter(file => path.extname(file) === ".slp");
	// compare uploaded json to upload directory
	let filesToUpload = uploadDir.filter(game => !uploaded.includes(game));
	mainWindow.webContents.send('uploadInfo-reply', filesToUpload.length);
	for (let i = 0; i < filesToUpload.length; i++) {
		console.log('loop number: ' + i)
		if(shouldCancel){
			break;
		}
		let match = await parse(path.join(data.path, filesToUpload[i]));
		if (typeof match == 'string') {
			mainWindow.webContents.send("invalidSlp");
			let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
				if (!uploaded.includes(filesToUpload[i])) {
					uploaded.push(filesToUpload[i]);
					fs.writeFileSync(path.join(storageFolder, '/uploaded/uploaded.json'), JSON.stringify(uploaded));
				}
			console.log(match);
		} else {
			try{
				const res = await axios.post('/uploads', { game: match }, { headers: {"auth-token": data.token } } )
				console.log(res.data);
				if(typeof res == "object"){
					let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
					if (!uploaded.includes(filesToUpload[i])) {
						uploaded.push(filesToUpload[i]);
						fs.writeFileSync(path.join(storageFolder, '/uploaded/uploaded.json'), JSON.stringify(uploaded));
					}
				}
			}catch(err){
				if(err) console.log(err.response.data);
				mainWindow.webContents.send("invalidSlp");
				let uploaded = JSON.parse(fs.readFileSync(path.join(storageFolder, 'uploaded/uploaded.json')));
					if (!uploaded.includes(filesToUpload[i])) {
						uploaded.push(filesToUpload[i]);
						fs.writeFileSync(path.join(storageFolder, '/uploaded/uploaded.json'), JSON.stringify(uploaded));
					}
			}
			mainWindow.webContents.send("upload-reply");
		}
	}
});