import {
  TransferableWorkerData,
  TransportDataMap,
  TransportOptions,
  WorkerData,
} from '../interface';
import { Transport } from '../transport';

export interface ServiceWorkerClientTransportOptions
  extends Partial<TransportOptions> {
  /**
   * Pass service worker using data transport.
   */
  serviceWorker: ServiceWorker;
}

abstract class ServiceWorkerClientTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    serviceWorker,
    listen = (callback) => {
      navigator.serviceWorker.addEventListener('message', ({ data }) => {
        callback(data);
      });
    },
    send = (message: WorkerData) =>
      serviceWorker.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: ServiceWorkerClientTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

abstract class ServiceWorkerServiceTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    listen = (callback) => {
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
  }: Partial<TransportOptions> = {}) {
    super({
      listen,
      send,
    });
  }
}

export const ServiceWorkerTransport = {
  Client: ServiceWorkerClientTransport,
  Service: ServiceWorkerServiceTransport,
};
