import { ListenOptions, TransportDataMap, TransportOptions } from './interface';
import { Transport } from './transport';

export interface WorkerExternalTransportOptions
  extends Partial<TransportOptions> {
  /**
   * Pass web worker using data transport.
   */
  worker: Worker;
}

type TransferableWorkerData = Record<string, any> & {
  /**
   * Specify data by transferring ownership (transferable objects)
   */
  transfer?: Transferable[];
};

export type WorkerData =
  | TransferableWorkerData
  | any[]
  | string
  | number
  | boolean
  | null
  | undefined;

class WorkerExternalTransport<
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
  }: WorkerExternalTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

class WorkerInternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    listen = (callback: (options: ListenOptions) => void) => {
      onmessage = ({ data }: MessageEvent<any>) => {
        callback(data);
      };
    },
    // TODO: fix - https://github.com/microsoft/TypeScript/issues/12657
    // TODO: fix type
    send = (message: WorkerData) =>
      (postMessage as any)(message, (message as TransferableWorkerData)?.transfer || []),
  } = {}) {
    super({
      listen,
      send,
    });
  }
}

export const WorkerTransport = {
  External: WorkerExternalTransport,
  Internal: WorkerInternalTransport,
};
