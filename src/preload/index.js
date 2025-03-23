import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import { setupIpcTracker } from '../../EXTENSION/ipc-tracker-preload'
setupIpcTracker() // Inject IPC tracker

const api = {
  sendTestIpc: (message) => {
    ipcRenderer.send('test-renderer-to-main', message)
  },

  helloRenderer: (str) => {
    ipcRenderer.send('hello-renderer', str)
  },

  onTestIpc: (callback) => {
    ipcRenderer.on('test-main-to-renderer', (event, data) => {
      console.log('[Preload] Received test-main-to-renderer:', data)
      callback(data)
    })
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api

  if (process.env.NODE_ENV === 'development') {
    window.__devtron = { require: require, process: process }
  }
}
