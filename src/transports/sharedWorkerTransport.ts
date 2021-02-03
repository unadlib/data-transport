import { callbackKey } from '../constant';
import { listen } from '../decorators';
import {
  TransferableWorkerData,
  TransportOptions,
  WorkerData,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';
interface InternalToMain {
  connect(): Promise<void>;
}

export interface SharedWorkerMainTransportOptions
  extends Partial<TransportOptions> {
  /**
   * Pass web worker using data transport.
   */
  worker: SharedWorker;
}

export interface SharedWorkerInternalTransportOptions
  extends Partial<TransportOptions> {}

abstract class SharedWorkerMainTransport<T = {}>
  extends Transport<T>
  implements InternalToMain {
  protected onConnect?(): void;

  constructor({
    worker,
    listener = (callback) => {
      worker.port.onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    sender = (message: WorkerData) =>
      worker.port.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
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
  private [callbackKey]!: (options: ListenerOptions) => void;

  constructor({
    listener = function (this: SharedWorkerInternalTransport, callback) {
      this[callbackKey] = callback;
    },
    sender = (message: WorkerData) => {
      const port: MessagePort = (message as any)._port;
      if (port) {
        delete (message as any)._port;
        port.postMessage(
          message,
          (message as TransferableWorkerData)?.transfer || []
        );
      } else {
        // TODO: select a client for sender.
        this.ports.forEach((port) => {
          port.postMessage(
            message,
            (message as TransferableWorkerData)?.transfer || []
          );
        });
      }
    },
  }: SharedWorkerInternalTransportOptions = {}) {
    super({
      listener,
      sender,
    });
    // TODO: fix type
    (self as any).onconnect = (e: any) => {
      const port: MessagePort = e.ports[0];
      // TODO: clear port when the port's client is closed.
      this.ports.push(port);
      port.onmessage = ({ data }) => {
        data._port = port;
        this[callbackKey](data);
      };
      // TODO: fix type
      // @ts-ignore
      this.send({ name: 'connect', respond: false });
    };
  }
}

export const SharedWorkerTransport = {
  Main: SharedWorkerMainTransport,
  Worker: SharedWorkerInternalTransport,
};
