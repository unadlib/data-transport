import { TransportDataMap, TransportOptions } from '../interface';
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

abstract class BrowserExtensionsTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    browser = (window as any).browser ?? (window as any).chrome,
    listener = (callback) => {
      browser.runtime.onMessage.addListener((data: any) => {
        callback(data);
      });
    },
    sender = (message) => {
      // TODO: fix about `sendResponse` for a single point of emission
      browser.runtime.sendMessage(message);
    },
  }: BrowserExtensionsTransportOptions = {}) {
    super({
      listener,
      sender,
    });
  }
}

abstract class BrowserExtensionsPortTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
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
