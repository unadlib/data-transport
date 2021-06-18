import {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';

export interface WorkerMainTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {
  /**
   * Pass web worker using data transport.
   */
  worker: Worker;
}

export interface WorkerInternalTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {}

abstract class WorkerMainTransport<T = {}> extends Transport<T> {
  constructor({
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
  }: WorkerMainTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

abstract class WorkerInternalTransport<T = {}> extends Transport<T> {
  constructor({
    listener = (callback) => {
      const handler = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
      addEventListener('message', handler);
      return () => {
        // TODO: fix type
        // @ts-ignore
        removeListener('message', handler);
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      postMessage(message, transfer);
    },
    ...options
  }: WorkerInternalTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export const WorkerTransport = {
  Main: WorkerMainTransport,
  Worker: WorkerInternalTransport,
};
