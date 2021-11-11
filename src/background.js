'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain, session } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
const { Worker, isMainThread } = require('worker_threads');
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar');

// BASE URL FOR REQUESTS
axios.defaults.baseURL = "https://superstatbros.com";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

let mainWindow

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

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		mainWindow.loadURL('app://./index.html')
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
	watcher.on('add', (filepath) => {
		// Sends path to worker to parse/upload
		if (isMainThread) {
			// run thread and pass info
			const worker = new Worker(path.join(__dirname, './slpWorker.js'), { workerData: { value: filepath } });
			worker.on('message', (result) => {
				// Upload SLP file
				axios({ method: 'post', url: '/uploads', data: { game: result }, headers: { "auth-token": data.token } })
					.then(function (res) {
						console.log(res.data);
						mainWindow.webContents.send("upload-complete", { settings: result.settings, id: result.id });
					})
					.catch(function (error) {
						console.log(error);
					});
			});
			worker.on('exit', (code) => {
				if (code !== 0)
					throw new Error(`Worker stopped with exit code ${code}`);
				else
					console.log('Worker stopped ' + code);
			});
		}
	})
	// Stop live logging
	ipcMain.on("stopLogging", () => {
		watcher.close().then(() => console.log('stopped watching directory'));
	});
})
