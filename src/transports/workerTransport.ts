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
      worker.onmessage = ({
        data,
      }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
        callback(data);
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      worker.postMessage(message, transfer);
    },
  }: WorkerMainTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

abstract class WorkerInternalTransport<T = {}> extends Transport<T> {
  constructor({
    listener = (callback) => {
      onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      postMessage(message, transfer);
    },
  }: WorkerInternalTransportOptions = {}) {
    super({
      listener,
      sender,
    });
  }
}

export const WorkerTransport = {
  Main: WorkerMainTransport,
  Worker: WorkerInternalTransport,
};
