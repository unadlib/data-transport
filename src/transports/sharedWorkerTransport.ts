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

abstract class SharedWorkerMainTransport<T = {}>
  extends Transport<T>
  implements InternalToMain {
  /**
   * Define a connection listener.
   */
  protected onConnect?(): void;

  constructor({
    worker,
    listener = (callback) => {
      worker.port.onmessage = ({
        data,
      }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
        callback(data);
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      worker.port.postMessage(message, transfer);
    },
  }: SharedWorkerMainTransportOptions) {
    super({
      listener,
      sender,
    });
  }

  @listen
  async connect() {
    this.onConnect?.();
  }
}

abstract class SharedWorkerInternalTransport<T = {}> extends Transport<
  T & InternalToMain
> {
  protected ports: MessagePort[] = [];
  private [callbackKey]!: (options: ListenerOptions<SharedWorkerPort>) => void;

  constructor({
    listener = function (this: SharedWorkerInternalTransport, callback) {
      this[callbackKey] = callback;
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
  }: SharedWorkerInternalTransportOptions = {}) {
    super({
      listener,
      sender,
    });
    self.onconnect = (e) => {
      const port = e.ports[0];
      // TODO: clear port when the port's client is closed.
      this.ports.push(port);
      port.onmessage = ({
        data,
      }: MessageEvent<ListenerOptions<SharedWorkerPort>>) => {
        data._port = port;
        this[callbackKey](data);
      };
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
