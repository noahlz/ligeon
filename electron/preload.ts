import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Will be populated later
})
