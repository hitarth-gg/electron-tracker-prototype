// This script runs in the background and serves as a central point for collecting IPC events

let ipcEvents = [] // store for IPC events
const MAX_EVENTS = 1000

// store active connections
const connections = {
  panel: null,
  inspectedWindow: null
}
console.log('background.js: touched --------------')
/*
  afaik chrome aggressively caches bacgrkound scripts so if any
  changes in background.js are not reflected then try to delete
  the cache folders under `appdata/roaming/electron-app` or some address like that, i forgor :(
*/

// listen for connections from the devtools panel
chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'ipc-tracker-panel') {
    // Store the panel connection
    connections.panel = port

    port.onMessage.addListener(function (message) {
      if (message.status === 'ping') {
        console.log('background.js: ping received, keep alive')
        port.postMessage({ reply: 'pong from background via port' })
      } else if (message.action === 'get-events') {
        ipcEvents.forEach((event) => {
          port.postMessage({ type: 'ipc-event', event })
        })
      } else if (message.action === 'clear-events') {
        ipcEvents = []
        if (connections.inspectedWindow) {
          connections.inspectedWindow.postMessage({ action: 'clear-events' })
        }
      }
    })

    /*
      I think background.js now acts like a service worker so connections are stopped if no activity is performed for a while.
      More testing is needed, this is just a prototype to explore the possibilities.
    */
    port.onDisconnect.addListener(function () {
      console.log('Panel disconnected')
      connections.panel = null
    })
  } else if (port.name === 'ipc-tracker-content') {
    console.log('ipc-tracker-content: touched')

    connections.inspectedWindow = port

    // listen for messages from the content-script
    port.onMessage.addListener(function (message) {
      if (message.type === 'ipc-event') {
        // add the event to our store
        addIpcEvent(message.event)

        // forward the event to the panel if it's connected
        if (connections.panel) {
          connections.panel.postMessage({ type: 'ipc-event', event: message.event })
        }
      }
    })

    // handle disconnection
    port.onDisconnect.addListener(function () {
      connections.inspectedWindow = null
    })
  }
})

function addIpcEvent(event) {
  ipcEvents.push(event)
  console.log('sizee: ' + ipcEvents.length)

  // keep only the most recent events, this can probably be done more efficiently
  if (ipcEvents.length > MAX_EVENTS) {
    ipcEvents = ipcEvents.slice(-MAX_EVENTS)
  }
}
