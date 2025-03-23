import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useEffect } from 'react'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  const helloRenderer = () => window.api.helloRenderer('random string as argument lol')

  useEffect(() => {
    window.ipcRenderer.on('test-ipc', (data) => {
      console.log('Got message from main!', data)
    })
    return () => {
      window.ipcRenderer.removeAllListeners('test-ipc')
    }
  }, [])

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={helloRenderer}>
            Send IPC: MTR
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC: RTM & MTR Both
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
