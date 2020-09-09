import {
  BrowserWindow,
  IpcRendererEvent,
  IpcMainEvent,
  IpcMain,
  IpcRenderer,
} from 'electron';
import { TransportDataMap, TransportOptions } from '../interface';
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
  /**
   * IpcMain
   */
  ipcMain: IpcMain;
}

export interface ElectronRendererTransportOptions
  extends ElectronTransportOptions {
  /**
   * IpcMain
   */
  ipcRenderer: IpcRenderer;
}

abstract class ElectronMainTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    ipcMain,
    browserWindow,
    channel = defaultChannel,
    listen = (callback) => {
      ipcMain.on(channel, (e: IpcMainEvent, data: any) => {
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
    ipcRenderer,
    channel = defaultChannel,
    listen = (callback) => {
      ipcRenderer.on(channel, (_: IpcRendererEvent, data: any) => {
        callback(data);
      });
    },
    send = (message) => ipcRenderer.send(channel, message),
  }: ElectronRendererTransportOptions) {
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
