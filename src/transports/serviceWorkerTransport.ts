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
      addEventListener('message', ({ data, source }) => {
        callback({
          ...data,
          _clientId: (source as any)?.id,
        });
      });
    },
    sender = async (message: WorkerData) => {
      if ((message as any)._clientId) {
        const client = await (self as any).clients.get(
          (message as any)._clientId
        );
        if (!client) {
          console.warn(`The client "${(message as any)._clientId}" is closed.`);
          return;
        }
        client.postMessage(
          message,
          (message as TransferableWorkerData)?.transfer || []
        );
        return;
      }

      // TODO: fix https://github.com/microsoft/TypeScript/issues/14877
      // TODO: select a client for sender.
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
