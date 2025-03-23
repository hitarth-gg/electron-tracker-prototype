// This script injects into the renderer process to capture IPC events

console.log('IPC Tracker preload script loaded')

import { ipcRenderer, contextBridge } from 'electron'

const originalSend = ipcRenderer.send
const originalInvoke = ipcRenderer.invoke
const originalSendSync = ipcRenderer.sendSync
const originalOn = ipcRenderer.on
const originalOnce = ipcRenderer.once

// track events
function trackIpcEvent(direction, channel, args) {
  const event = {
    timestamp: Date.now(),
    direction,
    channel,
    args: sanitizeArgs(args),
    processId: process.pid
  }
  console.log(direction + ' ' + channel + ' ' + args)

  window.postMessage(
    {
      source: 'ipc-tracker',
      event
    },
    '*'
  )
}

function sanitizeArgs(args) {
  try {
    return JSON.parse(JSON.stringify(args))
  } catch (e) {
    return [`[Couldn't stringify args: ${e.message}]`]
  }
}

ipcRenderer.on('ipc-event', (event, data) => {
  console.log('Received ipc-event:', data)
  window.postMessage(
    {
      source: 'ipc-tracker',
      event: data
    },
    '*'
  )
})

// to setup the IPC tracker in the renderer process
export function setupIpcTracker() {

  // add the event listener in the html page
  window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data || event.data.source !== 'ipc-tracker') return
    window.postMessage(
      {
        source: 'ipc-tracker-page',
        event: event.data.event
      },
      '*'
    )
  })

  // to test if eventlisteners work there or not, I'll remove this later
  window.addEventListener('keydown', function (e) {
    if (e.key === 'y') {
      console.log('Pressed Y inside preload (context isolated): Y pressed')
    }
  })

  const wrappedIpcRenderer = {
    // track send
    send: (channel, ...args) => {
      trackIpcEvent('renderer-to-main', channel, args)
      return originalSend.call(ipcRenderer, channel, ...args)
    },

    // track invoke
    invoke: (channel, ...args) => {
      trackIpcEvent('renderer-to-main', channel, args)
      return originalInvoke.call(ipcRenderer, channel, ...args)
    },

    // track sendSync
    sendSync: (channel, ...args) => {
      trackIpcEvent('renderer-to-main', channel, args)
      return originalSendSync.call(ipcRenderer, channel, ...args)
    },

    // track on
    on: (channel, listener) => {
      const wrappedListener = (...args) => {
        trackIpcEvent('main-to-renderer', channel, args)
        listener(...args)
      }
      return originalOn.call(ipcRenderer, channel, wrappedListener)
    },

    // track once
    once: (channel, listener) => {
      const wrappedListener = (...args) => {
        trackIpcEvent('main-to-renderer', channel, args)
        listener(...args)
      }
      return originalOnce.call(ipcRenderer, channel, wrappedListener)
    },

    // proxy other methods // ⚠️ NOTE : add more as needed here ⚠️
    removeListener: (...args) => ipcRenderer.removeListener(...args),
    removeAllListeners: (...args) => ipcRenderer.removeAllListeners(...args),
    eventNames: (...args) => ipcRenderer.eventNames(...args),
    listenerCount: (...args) => ipcRenderer.listenerCount(...args)
  }

  // expose via contextBridge
  contextBridge.exposeInMainWorld('ipcRenderer', wrappedIpcRenderer)
}
