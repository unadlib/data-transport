import { callbackKey, prefixKey } from '../constant';
import { listen } from '../decorators';
import {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
  BaseInteraction,
} from '../interface';
import { getAction, Transport } from '../transport';

declare var self: SharedWorkerGlobalScope;
interface SharedWorkerPort extends TransferableWorker {
  _port?: MessagePort;
}

export interface SharedWorkerClientTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {
  /**
   * Pass a shared worker instance for data transport.
   */
  worker: SharedWorker;
}

type ClientCallback = () => void | Promise<void>;
type WorkerCallback = (clientId: string) => void | Promise<void>;

const connectEventName = 'sharedworker-connect';
const disconnectEventName = 'sharedworker-disconnect';

export interface SharedWorkerInternalTransportOptions
  extends Partial<TransportOptions<SharedWorkerPort>> {}

export abstract class SharedWorkerClientTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: SharedWorkerClientTransportOptions) {
    const {
      worker,
      listener = (callback) => {
        const handler = ({
          data,
        }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
          callback(data);
        };
        worker.port.addEventListener('message', handler);
        worker.port.start();
        return () => {
          worker.port.removeEventListener('message', handler);
        };
      },
      sender = (message) => {
        const transfer = message.transfer ?? [];
        delete message.transfer;
        worker.port.postMessage(message, transfer);
      },
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
    // do not use `unload` event
    // https://developer.chrome.com/docs/web-platform/deprecating-unload
    window.addEventListener('pagehide', () => {
      // @ts-ignore
      this.emit({ name: disconnectEventName, respond: false }, this.id);
    });
    // @ts-ignore
    this.listen(connectEventName, async () => {
      Promise.resolve().then(() => {
        this._handleConnect();
      });
      return this.id;
    });
    // ensure the connect event is sent when the client connect to the worker
    // @ts-ignore
    this.emit({ name: connectEventName, respond: false, silent: true });
  }

  private _handleConnect() {
    if (this._connected) return;
    this._connected = true;
    this._onConnectCallback.forEach((callback) => {
      callback();
    });
  }

  private _connected = false;

  private _onConnectCallback = new Set<ClientCallback>();

  onConnect(callback: ClientCallback) {
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }
}

interface SharedWorkerTransportPort extends MessagePort {
  _handler?: (options: MessageEvent<ListenerOptions<SharedWorkerPort>>) => void;
}

export abstract class SharedWorkerInternalTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  protected ports = new Map<string, MessagePort>();
  protected tempPorts = new Set<MessagePort>();
  private [callbackKey]!: (options: ListenerOptions<SharedWorkerPort>) => void;

  constructor(_options: SharedWorkerInternalTransportOptions = {}) {
    const {
      listener = function (this: SharedWorkerInternalTransport, callback) {
        this[callbackKey] = callback;
        return () => {
          this.ports.forEach((port: SharedWorkerTransportPort) => {
            port._handler && port.removeEventListener('message', port._handler);
            delete port._handler;
          });
          self.close();
        };
      },
      sender = (message) => {
        const transfer = message.transfer ?? [];
        delete message.transfer;
        const port = message._extra?._port;
        // pick a client port for sender.
        if (port) {
          delete message._extra!._port;
          port.postMessage(message, transfer);
        } else if (
          message.type === 'response' &&
          // @ts-ignore
          this.ports.has(message.requestId)
        ) {
          // @ts-ignore
          const port = this.ports.get(message.requestId)!;
          port.postMessage(message, transfer);
        } else {
          this.ports.forEach((port) => {
            try {
              port.postMessage(message, transfer);
            } catch (error) {
              console.error(error);
            }
          });
          this.tempPorts.forEach((port) => {
            try {
              port.postMessage(message, transfer);
            } catch (error) {
              console.error(error);
            }
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

    const disconnectAction = getAction(this[prefixKey]!, disconnectEventName);
    const connectEvent = getAction(this[prefixKey]!, connectEventName);
    self.addEventListener('connect', async (e) => {
      const port: SharedWorkerTransportPort = e.ports[0];
      port._handler = ({
        data,
      }: MessageEvent<ListenerOptions<SharedWorkerPort>>) => {
        if (data.hasRespond) {
          data._extra = data._extra ?? {};
          data._extra._port = port;
        }
        if (
          data.action === disconnectAction &&
          this.ports.has(data.requestId)
        ) {
          // clear port and clientId when the port's client is disconnected.
          this.ports.delete(data.requestId);
          this._onDisconnectCallback.forEach((callback) => {
            callback(data.requestId);
          });
        }
        if (data.type === 'request' && data.action === connectEvent) {
          this.emit({
            // @ts-ignore
            name: connectEventName,
            _extra: { _port: port },
            silent: true,
            respond: false,
          });
          this._handleConnect(data.requestId, port);
        }
        this[callbackKey](data);
      };
      port.addEventListener('message', port._handler);
      port.start();
      this.tempPorts.add(port);
      try {
        // because parameters is unknown
        // @ts-ignore
        const id: string = await this.emit({
          // @ts-ignore
          name: connectEventName,
          _extra: { _port: port },
          silent: true,
        });
        this._handleConnect(id, port);
      } catch (err) {
        this.tempPorts.delete(port);
        console.error(err);
      }
    });
  }

  private _onConnectCallback = new Set<WorkerCallback>();

  onConnect(callback: WorkerCallback) {
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }

  private _handleConnect(id: string, port: MessagePort) {
    if (id && !this.ports.has(id)) {
      this.ports.set(id, port);
      this.tempPorts.delete(port);
      this._onConnectCallback.forEach((callback) => {
        callback(id);
      });
    }
  }

  private _onDisconnectCallback = new Set<WorkerCallback>();

  onDisconnect(callback: WorkerCallback) {
    this._onDisconnectCallback.add(callback);
    return () => {
      this._onDisconnectCallback.delete(callback);
    };
  }
}

export const SharedWorkerTransport = {
  Client: SharedWorkerClientTransport,
  Worker: SharedWorkerInternalTransport,
};
