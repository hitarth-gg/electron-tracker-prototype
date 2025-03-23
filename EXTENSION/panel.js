console.log('Panel script loaded')

const port = chrome.runtime.connect({ name: 'ipc-tracker-panel' })
const logContainer = document.getElementById('log-container')
const clearBtn = document.getElementById('clear-btn')

const pingInterval = setInterval(() => {
  port.postMessage({
    status: 'ping'
  })
}, 10000)

port.onDisconnect.addListener(() => {
  clearInterval(pingInterval)
  console.log('Panel Port disconnected')
})
port.postMessage({ action: 'get-events' })

port.onMessage.addListener((message) => {
  if (message.type === 'ipc-event') {
    renderEvent(message.event)
  }
})

function formatJSON(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2)
  }

  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number'
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key'
            match = match.replace(/"/g, '').replace(/:$/, '')
            return `<span class="${cls}">"${match}":</span>`
          } else {
            cls = 'json-string'
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean'
        } else if (/null/.test(match)) {
          cls = 'json-null'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

function renderEvent(event) {
  const div = document.createElement('div')
  div.className = 'log-entry'

  if (event.direction.includes('SEND')) {
    div.classList.add('send-event')
  } else if (event.direction.includes('RECEIVE')) {
    div.classList.add('receive-event')
  }

  const formattedTime = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  div.innerHTML = `
    <span class="timestamp">[${formattedTime}]</span>
    <span class="direction">${event.direction}:</span>
    <span class="channel">${event.channel}</span>
    <pre class="args">${formatJSON(event.args)}</pre>
  `
  logContainer.appendChild(div)
  logContainer.scrollTop = logContainer.scrollHeight
}

clearBtn.addEventListener('click', () => {
  logContainer.innerHTML = ''
  port.postMessage({ action: 'clear-events' })
})

const style = document.createElement('style')
style.textContent = `
  .json-key { color: #5046e4; }
  .json-string { color: #0f766e; }
  .json-number { color: #b91c1c; }
  .json-boolean { color: #b45309; }
  .json-null { color: #9333ea; }

  .send-event { border-left-color: #2563eb; }
  .receive-event { border-left-color: #16a34a; }
`
document.head.appendChild(style)
