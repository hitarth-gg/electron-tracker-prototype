// const port = chrome.runtime.connect({ name: 'ipc-tracker-content' })
console.log('content-script.js: touched2')
let port

function ensurePort() {
  if (!port || port.disconnected) {
    port = chrome.runtime.connect({ name: 'ipc-tracker-content' })
    port.onDisconnect.addListener(() => {
      console.warn('Port disconnected')
      port = null
    })
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window || event.data.source !== 'ipc-tracker') return
  ensurePort()
  if (port) {
    port.postMessage({
      type: 'ipc-event',
      event: event.data.event
    })
  }
})
