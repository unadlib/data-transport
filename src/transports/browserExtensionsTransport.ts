import { callbackKey } from '../constant';
import { ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface BrowserExtensionsTransportOptions
  extends Partial<TransportOptions> {
  // TODO: fix browser | chrome;
  browser?: any;
}

export interface BrowserExtensionsPortTransportOptions
  extends Partial<TransportOptions> {
  // TODO: fix port type;
  port: any;
}

abstract class BrowserExtensionsTransport<T = {}> extends Transport<T> {
  private [callbackKey]!: (options: ListenerOptions) => void;

  constructor({
    browser = (window as any).browser ?? (window as any).chrome,
    listener = (callback) => {
      this[callbackKey] = callback;
      browser.runtime.onMessage.addListener(
        (data: any, sender: any, sendResponse: any) => {
          data._sendResponse = sendResponse;
          callback(data);
        }
      );
    },
    sender = (message) => {
      if ((message as any)._sendResponse) {
        const sendResponse = (message as any)._sendResponse;
        delete (message as any)._sendResponse;
        sendResponse(message);
      } else {
        browser.runtime.sendMessage(message, this[callbackKey]);
      }
    },
  }: BrowserExtensionsTransportOptions = {}) {
    super({
      listener,
      sender,
    });
  }
}

abstract class BrowserExtensionsPortTransport<T = {}> extends Transport<T> {
  constructor({
    port,
    listener = (callback) => {
      port.onMessage.addListener((data: any) => {
        callback(data);
      });
    },
    sender = (message) => {
      port.postMessage(message);
    },
  }: BrowserExtensionsPortTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

export { BrowserExtensionsTransport, BrowserExtensionsPortTransport };
