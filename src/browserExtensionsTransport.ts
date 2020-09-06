import { TransportDataMap, TransportOptions } from './interface';
import { Transport } from './transport';

export interface BrowserExtensionsTransportOptions
  extends Partial<TransportOptions> {
  // TODO: fix browser | chrome;
  browser?: any;
}

abstract class BrowserExtensionsTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    browser = (window as any).browser ?? (window as any).chrome,
    listen = (callback: any) => {
      browser.runtime.onMessage.addListener((data: any) => {
        callback(data);
      });
    },
    send = (message: any) => {
      // TODO: fix about `sendResponse` for a single point of emission
      browser.runtime.sendMessage(message);
    },
  }: BrowserExtensionsTransportOptions = {}) {
    super({
      listen,
      send,
    });
  }
}

export { BrowserExtensionsTransport };
