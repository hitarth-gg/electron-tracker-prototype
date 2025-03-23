// This file basically patches the methods to log IPC events
// It is required in the main process of the Electron app

const { ipcMain, webContents } = require('electron')

module.exports = function injectIpcTracker() {
  function trackIpcEvent(direction, channel, args, senderId) {
    const eventData = {
      direction,
      channel,
      args,
      senderId,
      timestamp: Date.now()
    }

    console.log(`[IPC] ${direction} | ${channel} | sender: ${senderId} | args:`, args)
    // send event to renderer, which then sends it to the devtools
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('ipc-event', eventData)
    })
  }

  // patch ipcMain methods
  const patchIpc = (methodName) => {
    const original = ipcMain[methodName]
    ipcMain[methodName] = function (channel, listener) {
      const wrapped = function (event, ...args) {
        trackIpcEvent('renderer-to-main', channel, args, event.sender.id)
        return listener(event, ...args)
      }
      return original.call(ipcMain, channel, wrapped)
    }
  }

  patchIpc('on')
  patchIpc('once')
  patchIpc('handle')

  console.log('IPC Tracker injected!')
}
