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
  }
}

export const WorkerTransport = {
  Main: WorkerMainTransport,
  Worker: WorkerInternalTransport,
};
