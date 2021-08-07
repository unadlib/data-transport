import { callbackKey } from '../constant';
import { listen } from '../decorators';
import {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';

declare var self: SharedWorkerGlobalScope;
interface InternalToMain {
  connect(): Promise<void>;
}

interface SharedWorkerPort extends TransferableWorker {
  _port?: MessagePort;
}

export interface SharedWorkerMainTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {
  /**
   * Pass a shared worker instance for data transport.
   */
  worker: SharedWorker;
}

export interface SharedWorkerInternalTransportOptions
  extends Partial<TransportOptions<SharedWorkerPort>> {}

export abstract class SharedWorkerMainTransport<T = any, P = any>
  extends Transport<T, P>
  implements InternalToMain {
  /**
   * Define a connection listener.
   */
  protected onConnect?(): void;

  constructor({
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
  }: SharedWorkerMainTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }

  @listen
  async connect() {
    this.onConnect?.();
  }
}

interface SharedWorkerTransportPort extends MessagePort {
  _handler?: (options: MessageEvent<ListenerOptions<SharedWorkerPort>>) => void;
}

export abstract class SharedWorkerInternalTransport<
  T = any,
  P = any
> extends Transport<T & InternalToMain, P> {
  protected ports = new Set<MessagePort>();
  private [callbackKey]!: (options: ListenerOptions<SharedWorkerPort>) => void;

  constructor({
    listener = function (this: SharedWorkerInternalTransport, callback) {
      this[callbackKey] = callback;
      return () => {
        this.ports.forEach((port: SharedWorkerTransportPort) => {
          port._handler && port.removeEventListener('message', port._handler);
          delete port._handler;
        });
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      const port = message._port;
      if (port) {
        delete message._port;
        port.postMessage(message, transfer);
      } else {
        // TODO: select a client for sender.
        this.ports.forEach((port) => {
          port.postMessage(message, transfer);
        });
      }
    },
    ...options
  }: SharedWorkerInternalTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
    self.onconnect = (e) => {
      const port: SharedWorkerTransportPort = e.ports[0];
      // TODO: clear port when the port's client is disconnected.
      this.ports.add(port);
      port._handler = ({
        data,
      }: MessageEvent<ListenerOptions<SharedWorkerPort>>) => {
        data._port = port;
        this[callbackKey](data);
      };
      port.addEventListener('message', port._handler);
      port.start();
      // because parameters is unknown
      // @ts-ignore
      this.emit({ name: 'connect', respond: false });
    };
  }
}

export const SharedWorkerTransport = {
  Main: SharedWorkerMainTransport,
  Worker: SharedWorkerInternalTransport,
};
