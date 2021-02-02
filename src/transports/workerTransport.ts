import {
  TransferableWorkerData,
  TransportOptions,
  WorkerData,
} from '../interface';
import { Transport } from '../transport';

export interface WorkerMainTransportOptions extends Partial<TransportOptions> {
  /**
   * Pass web worker using data transport.
   */
  worker: Worker;
}

export interface WorkerInternalTransportOptions
  extends Partial<TransportOptions> {}

abstract class WorkerMainTransport<T = {}> extends Transport<T> {
  constructor({
    worker,
    listener = (callback) => {
      worker.onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    sender = (message: WorkerData) =>
      worker.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
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
    // TODO: fix - https://github.com/microsoft/TypeScript/issues/12657
    // TODO: fix type
    sender = (message: WorkerData) =>
      (postMessage as any)(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
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
