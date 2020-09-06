import {
  ListenOptions,
  TransferableWorkerData,
  TransportDataMap,
  TransportOptions,
  WorkerData,
} from './interface';
import { Transport } from './transport';

export interface ServiceWorkerExternalTransportOptions
  extends Partial<TransportOptions> {
  /**
   * Pass service worker using data transport.
   */
  serviceWorker: ServiceWorker;
}

class ServiceWorkerExternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    serviceWorker,
    listen = (callback: (options: ListenOptions) => void) => {
      navigator.serviceWorker.addEventListener('message', ({ data }) => {
        callback(data);
      });
    },
    send = (message: WorkerData) =>
      serviceWorker.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: ServiceWorkerExternalTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

class ServiceWorkerInternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    listen = (callback: (options: ListenOptions) => void) => {
      addEventListener('message', ({ data }) => {
        callback(data);
      });
    },
    send = (message: WorkerData) => {
      // TODO: fix https://github.com/microsoft/TypeScript/issues/14877
      (self as any).clients
        .matchAll()
        .then((all: any) =>
          all.map((client: any) =>
            client.postMessage(
              message,
              (message as TransferableWorkerData)?.transfer || []
            )
          )
        );
    },
  } = {}) {
    super({
      listen,
      send,
    });
  }
}

export const ServiceWorkerTransport = {
  External: ServiceWorkerExternalTransport,
  Internal: ServiceWorkerInternalTransport,
};
