import {
  TransferableWorkerData,
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

export interface ServiceWorkerServiceTransportOptions
  extends Partial<TransportOptions> {}

abstract class ServiceWorkerClientTransport<T = {}> extends Transport<T> {
  constructor({
    serviceWorker,
    listener = (callback) => {
      navigator.serviceWorker.addEventListener('message', ({ data }) => {
        callback(data);
      });
    },
    sender = (message: WorkerData) =>
      serviceWorker.postMessage(
        message,
        (message as TransferableWorkerData)?.transfer || []
      ),
  }: ServiceWorkerClientTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

abstract class ServiceWorkerServiceTransport<T = {}> extends Transport<T> {
  constructor({
    listener = (callback) => {
      addEventListener('message', ({ data }) => {
        callback(data);
      });
    },
    sender = (message: WorkerData) => {
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
  }: ServiceWorkerServiceTransportOptions = {}) {
    super({
      listener,
      sender,
    });
  }
}

export const ServiceWorkerTransport = {
  Client: ServiceWorkerClientTransport,
  Service: ServiceWorkerServiceTransport,
};
