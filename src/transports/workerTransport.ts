import type {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
  BaseInteraction,
} from '../interface';
import { Transport } from '../transport';

// follow issue: https://github.com/microsoft/TypeScript/issues/20595
// workaround: `tsc --skipLibCheck`.
declare var self: WorkerGlobalScope;

type ClientCallback = () => void | Promise<void>;

const connectEventName = 'worker-connect';

export interface WorkerMainTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {
  /**
   * Pass web worker using data transport.
   */
  worker: Worker;
}

export interface WorkerInternalTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {}

export abstract class WorkerMainTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: WorkerMainTransportOptions) {
    const {
      worker,
      listener = (callback) => {
        const handler = ({
          data,
        }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
          callback(data);
        };
        worker.addEventListener('message', handler);
        return () => {
          worker.removeEventListener('message', handler);
        };
      },
      sender = (message) => {
        const transfer = message.transfer ?? [];
        delete message.transfer;
        worker.postMessage(message, transfer);
      },
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });

    this.emit({
      // @ts-ignore
      name: connectEventName,
      respond: true,
      silent: true,
    }).then(this._handleConnectCallbacks);

    // @ts-ignore
    this.listen(connectEventName, this._handleConnectCallbacks);
  }

  private _connected = false;

  private _handleConnectCallbacks = async () => {
    if (this._connected) {
      return;
    }
    this._connected = true;
    this._onConnectCallback.forEach((callback) => {
      callback();
    });
    this._onConnectCallback.clear();
  };

  private _onConnectCallback = new Set<ClientCallback>();

  onConnect(callback: ClientCallback) {
    if (this._connected) {
      return callback();
    }
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }
}

export abstract class WorkerInternalTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: WorkerInternalTransportOptions = {}) {
    const {
      listener = (callback) => {
        const handler = (({ data }: MessageEvent<any>) => {
          callback(data);
        }) as EventListenerOrEventListenerObject;
        self.addEventListener('message', handler);
        return () => {
          self.removeEventListener('message', handler);
        };
      },
      sender = (message) => {
        const transfer = message.transfer ?? [];
        delete message.transfer;
        postMessage(message, transfer);
      },
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });

    this.emit({
      // @ts-ignore
      name: connectEventName,
      respond: true,
      silent: true,
    }).then(this._handleConnectCallbacks);

    // @ts-ignore
    this.listen(connectEventName, this._handleConnectCallbacks);
  }

  private _handleConnectCallbacks = async () => {
    if (this._connected) {
      return;
    }
    this._connected = true;
    this._onConnectCallback.forEach((callback) => {
      callback();
    });
    this._onConnectCallback.clear();
  };

  private _connected = false;

  private _onConnectCallback = new Set<ClientCallback>();

  onConnect(callback: ClientCallback) {
    if (this._connected) {
      return callback();
    }
    this._onConnectCallback.add(callback);
    return () => {
      this._onConnectCallback.delete(callback);
    };
  }
}

export const WorkerTransport = {
  Main: WorkerMainTransport,
  Worker: WorkerInternalTransport,
};
