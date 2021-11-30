// src/preload.js
const { contextBridge, ipcRenderer} = require("electron");
// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => {
    let validChannels = ["setCookie", "openDialog", "openDialogManual", "startLogging", "stopLogging", "upload", "manualUpload", "cancelUpload"] // <-- Array of all ipcRenderer Channels used in the client
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  on: (channel, func) => {
    let validChannels = ["log", "loginCookie", "folderPath", "folderPathManual", "upload-complete", "upload-reply", "uploadInfo-reply"] // <-- Array of all ipcMain Channels used in the electron
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  },
	invoke: async(channel, arg1, arg2) => {
		let validChannels = ["getGames"];
		if(validChannels.includes(channel)){
			return await ipcRenderer.invoke(channel,arg1, arg2);
		}
	}
})