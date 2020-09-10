import {
  TransferableWorkerData,
  TransportDataMap,
  TransportOptions,
  WorkerData,
} from '../interface';
import { Transport } from '../transport';

export interface WebWorkerMainTransportOptions
  extends Partial<TransportOptions> {
  /**
   * Pass web worker using data transport.
   */
  worker: Worker;
}

export interface WebWorkerInternalTransportOptions
  extends Partial<TransportOptions> {}

abstract class WorkerMainTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    worker,
    listen = (callback) => {
      worker.onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    send = (message: WorkerData) =>
      worker.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: WebWorkerMainTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

abstract class WorkerInternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    listen = (callback) => {
      onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    // TODO: fix - https://github.com/microsoft/TypeScript/issues/12657
    // TODO: fix type
    send = (message: WorkerData) =>
      (postMessage as any)(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: WorkerInternalTransportOptions = {}) {
    super({
      listen,
      send,
    });
  }
}

export const WorkerTransport = {
  Main: WorkerMainTransport,
  Worker: WorkerInternalTransport,
};
