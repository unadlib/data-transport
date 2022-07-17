import { callbackKey } from '../constant';
import type {
  IRequest,
  ListenerOptions,
  SendOptions,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

const transportName = '__DATA_TRANSPORT_BROWSER_EXTENSIONS__';

type Browser = typeof window.browser | typeof window.chrome;

const currentBrowser: Browser = window.browser ?? window.chrome;

type Port = browser.runtime.Port | chrome.runtime.Port;

interface SendResponse {
  _sendResponse?: (response?: SendOptions<SendResponse>) => void;
}

export interface BrowserExtensionsGenericTransportOptions
  extends Partial<TransportOptions<SendResponse>> {
  /**
   * browser extension API.
   */
  browser?: Browser;
}

export interface BrowserExtensionsMainTransportOptions
  extends Partial<TransportOptions<BrowserExtensionsMainPort>> {
  /**
   * browser extension API.
   */
  browser?: Browser;
}

export interface BrowserExtensionsClientTransportOptions
  extends Partial<TransportOptions> {
  /**
   * browser extension API.
   */
  browser?: Browser;
  /**
   * browser extension client port.
   */
  port?: Port;
}

interface BrowserExtensionsMainPort {
  _port?: Port;
}

export abstract class BrowserExtensionsGenericTransport<
  T = any,
  P = any
> extends Transport<T, P> {
  private [callbackKey]!: (options: ListenerOptions<SendResponse>) => void;

  constructor({
    browser = currentBrowser,
    listener = function (this: BrowserExtensionsGenericTransport, callback) {
      this[callbackKey] = callback;
      const handler = (
        data: ListenerOptions<SendResponse>,
        sender: browser.runtime.MessageSender | chrome.runtime.MessageSender,
        sendResponse: (response?: SendOptions<SendResponse>) => void
      ) => {
        data._sendResponse = sendResponse;
        callback(data);
      };
      browser.runtime.onMessage.addListener(handler);
      return () => {
        browser.runtime.onMessage.removeListener(handler);
      };
    },
    sender = function (this: BrowserExtensionsGenericTransport, message) {
      if (message._sendResponse) {
        const sendResponse = message._sendResponse;
        delete message._sendResponse;
        sendResponse(message);
      } else {
        // @ts-ignore
        browser.runtime.sendMessage(
          message,
          {},
          this[callbackKey] as (response: IRequest<SendResponse>) => void
        );
      }
    },
    ...options
  }: BrowserExtensionsGenericTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export abstract class BrowserExtensionsMainTransport<
  T = any,
  P = any
> extends Transport<T, P> {
  protected ports = new Set<Port>();

  private [callbackKey]!: (
    options: ListenerOptions<BrowserExtensionsMainPort>
  ) => void;

  constructor({
    browser = currentBrowser,
    listener = function (this: BrowserExtensionsMainTransport, callback) {
      this[callbackKey] = callback;
      return () => {
        this.ports.forEach((port) => {
          port.disconnect();
        });
      };
    },
    sender = function (this: BrowserExtensionsMainTransport, message) {
      const port = message._port;
      if (port) {
        delete message._port;
        port.postMessage(message);
      } else {
        // TODO: select an assignable port
        this.ports.forEach((port) => {
          port.postMessage(message);
        });
      }
    },
    ...options
  }: BrowserExtensionsMainTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
    browser.runtime.onConnect.addListener((port: Port) => {
      if (port.name === transportName) {
        this.ports.add(port);
        const handler = (data: any) => {
          data._port = port;
          this[callbackKey](data as ListenerOptions<BrowserExtensionsMainPort>);
        };
        port.onMessage.addListener(handler);
        port.onDisconnect.addListener(() => {
          port.onMessage.removeListener(handler);
          this.ports.delete(port);
        });
      }
    });
  }
}

export abstract class BrowserExtensionsClientTransport<
  T = any,
  P = any
> extends Transport<T, P> {
  constructor({
    browser = window.browser ?? window.chrome,
    port = browser.runtime.connect({ name: transportName }),
    listener = (callback) => {
      const handler = (options: object) => {
        callback(options as ListenerOptions<{}>);
      };
      port.onMessage.addListener(handler);
      return () => {
        port.onMessage.removeListener(handler);
      };
    },
    sender = (message) => {
      port.postMessage(message);
    },
    ...options
  }: BrowserExtensionsClientTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export const BrowserExtensionsTransport = {
  Main: BrowserExtensionsMainTransport,
  Client: BrowserExtensionsClientTransport,
};
