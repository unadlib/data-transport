import { listen } from '../decorators';
import {
  TransferableWorkerData,
  TransportOptions,
  WorkerData,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';

export const callbackKey: unique symbol = Symbol('callback');

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
  protected port!: MessagePort;
  private [callbackKey]!: (options: ListenerOptions) => void;

  constructor({
    listener = function (this: SharedWorkerInternalTransport, callback) {
      this[callbackKey] = callback;
    },
    sender = (message: WorkerData) =>
      this.port.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: SharedWorkerInternalTransportOptions = {}) {
    super({
      listener,
      sender,
    });
    // TODO: fix type
    (self as any).onconnect = (e: any) => {
      this.port = e.ports[0];
      this.port.onmessage = ({ data }) => {
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
