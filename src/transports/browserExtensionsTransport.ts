import { callbackKey } from '../constant';
import type {
  BaseInteraction,
  IRequest,
  ListenerOptions,
  SendOptions,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

const transportName = '__DATA_TRANSPORT_BROWSER_EXTENSIONS__';

type Browser = typeof global.browser | typeof global.chrome;

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

type ClientCallback = () => void | Promise<void>;
type MainCallback = (clientId: string) => void | Promise<void>;

export abstract class BrowserExtensionsGenericTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  private [callbackKey]!: (options: ListenerOptions<SendResponse>) => void;

  constructor(_options: BrowserExtensionsGenericTransportOptions = {}) {
    const {
      browser = global.browser ?? global.chrome,
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
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
  }
}

const connectEventName = 'sharedworker-connect';

export abstract class BrowserExtensionsMainTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  protected ports = new Map<string, Port>();

  private [callbackKey]!: (
    options: ListenerOptions<BrowserExtensionsMainPort>
  ) => void;

  constructor(_options: BrowserExtensionsMainTransportOptions = {}) {
    const {
      browser = global.browser ?? global.chrome,
      listener = function (this: BrowserExtensionsMainTransport, callback) {
        this[callbackKey] = callback;
        return () => {
          this.ports.forEach((port) => {
            port.disconnect();
          });
        };
      },
      sender = function (this: BrowserExtensionsMainTransport, message) {
        const port = message._extra?._port;
        if (port) {
          delete message._port;
          port.postMessage(message);
        } else if (
          message.type === 'response' &&
          // @ts-ignore
          this.ports.has(message.requestId)
        ) {
          // @ts-ignore
          const port = this.ports.get(message.requestId)!;
          port.postMessage(message);
        } else {
          this.ports.forEach((port) => {
            port.postMessage(message);
          });
        }
      },
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
    browser.runtime.onConnect.addListener(async (port: Port) => {
      if (port.name === transportName) {
        const handler = (data: any) => {
          data._extra = data._extra ?? {};
          data._extra._port = port;
          this[callbackKey](data as ListenerOptions<BrowserExtensionsMainPort>);
        };
        port.onMessage.addListener(handler);
        port.onDisconnect.addListener(() => {
          port.onMessage.removeListener(handler);
          this.ports.forEach((_port, id) => {
            if (_port === port) {
              this.ports.delete(id);
            }
          });
          this._onDisconnectCallback.forEach((callback) => {
            callback(id);
          });
        });

        // @ts-ignore
        const id: string = await this.emit({
          // @ts-ignore
          name: connectEventName,
          _extra: { _port: port },
        });
        this.ports.set(id, port);
        this._onConnectCallback.forEach((callback) => {
          callback(id);
        });
      }
    });
  }

  private _onConnectCallback = new Set<MainCallback>();

  onConnect(callback: MainCallback) {
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }

  private _onDisconnectCallback = new Set<MainCallback>();

  onDisconnect(callback: MainCallback) {
    this._onDisconnectCallback.add(callback);
    return () => {
      this._onDisconnectCallback.delete(callback);
    };
  }
}

export abstract class BrowserExtensionsClientTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: BrowserExtensionsClientTransportOptions = {}) {
    const {
      browser = global.browser ?? global.chrome,
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
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
    // @ts-ignore
    this.listen(connectEventName, async () => {
      Promise.resolve().then(() => {
        this._onConnectCallback.forEach((callback) => {
          callback();
        });
      });
      return this.id;
    });
  }

  private _onConnectCallback = new Set<ClientCallback>();

  onConnect(callback: ClientCallback) {
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }
}

export const BrowserExtensionsTransport = {
  Main: BrowserExtensionsMainTransport,
  Client: BrowserExtensionsClientTransport,
};
