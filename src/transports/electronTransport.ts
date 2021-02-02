// import {
//   BrowserWindow,
//   IpcRendererEvent,
//   IpcMainEvent,
//   IpcMain,
//   IpcRenderer,
// } from 'electron';
import { TransportOptions } from '../interface';
import { Transport } from '../transport';

const defaultChannel = '$$Electron_Transport$$';

interface ElectronTransportOptions extends Partial<TransportOptions> {
  /**
   * Specify a Electron channel name.
   */
  channel?: string;
}

export interface ElectronMainTransportOptions extends ElectronTransportOptions {
  /**
   * Specify a browser windows created by the Electron main process.
   */
  browserWindow: any;
  /**
   * Communicate asynchronously from the main process to renderer processes.
   */
  ipcMain: any;
}

export interface ElectronRendererTransportOptions
  extends ElectronTransportOptions {
  /**
   * Communicate asynchronously from a renderer process to the main process.
   */
  ipcRenderer: any;
}

abstract class ElectronMainTransport<T = {}> extends Transport<T> {
  constructor({
    ipcMain,
    browserWindow,
    channel = defaultChannel,
    listener = (callback) => {
      ipcMain.on(channel, (e: any, data: any) => {
        callback(data);
      });
    },
    sender = (message) => browserWindow.webContents.send(channel, message),
  }: ElectronMainTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

abstract class ElectronRendererTransport<T = {}> extends Transport<T> {
  constructor({
    ipcRenderer,
    channel = defaultChannel,
    listener = (callback) => {
      ipcRenderer.on(channel, (_: any, data: any) => {
        callback(data);
      });
    },
    sender = (message) => ipcRenderer.send(channel, message),
  }: ElectronRendererTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

export const ElectronTransport = {
  Main: ElectronMainTransport,
  Renderer: ElectronRendererTransport,
};
