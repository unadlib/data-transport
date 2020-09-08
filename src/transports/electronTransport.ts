import { TransportDataMap, TransportOptions } from '../interface';
import { BrowserWindow, IpcRendererEvent, IpcMainEvent } from 'electron';
import { Transport } from '../transport';

const defaultChannel = '$$Electron_Transport$$';

export interface ElectronTransportOptions extends Partial<TransportOptions> {
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
}

abstract class ElectronMainTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    browserWindow,
    channel = defaultChannel,
    listen = (callback) => {
      require('electron').ipcMain.on(channel, (e: IpcMainEvent, data: any) => {
        callback(data);
      });
    },
    send = (message) => browserWindow.webContents.send(channel, message),
  }: ElectronMainTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

abstract class ElectronRendererTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    channel = defaultChannel,
    listen = (callback) => {
      require('electron').ipcRenderer.on(
        channel,
        (_: IpcRendererEvent, data: any) => {
          callback(data);
        }
      );
    },
    send = (message) => require('electron').ipcRenderer.send(channel, message),
  }: ElectronTransportOptions = {}) {
    super({
      listen,
      send,
    });
  }
}

export const ElectronTransport = {
  Main: ElectronMainTransport,
  Renderer: ElectronRendererTransport,
};
