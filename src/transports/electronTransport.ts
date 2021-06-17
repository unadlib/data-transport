import type { BrowserWindow, IpcMain, IpcRenderer } from 'electron';
import { ListenerOptions, TransportOptions } from '../interface';
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
  browserWindow: BrowserWindow;
  /**
   * Communicate asynchronously from the main process to renderer processes.
   */
  ipcMain: IpcMain;
}

export interface ElectronRendererTransportOptions
  extends ElectronTransportOptions {
  /**
   * Communicate asynchronously from a renderer process to the main process.
   */
  ipcRenderer: IpcRenderer;
}

abstract class ElectronMainTransport<T = {}> extends Transport<T> {
  constructor({
    ipcMain,
    browserWindow,
    channel = defaultChannel,
    listener = (callback) => {
      const handler = (_: Electron.IpcMainEvent, data: ListenerOptions) => {
        callback(data);
      }
      ipcMain.on(channel, handler);
      return () => {
        ipcMain.off(channel, handler);
      };
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
      const handler = (_: Electron.IpcRendererEvent, data: ListenerOptions) => {
        callback(data);
      };
      ipcRenderer.on(channel, handler);
      return () => {
        ipcRenderer.off(channel, handler);
      };
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
