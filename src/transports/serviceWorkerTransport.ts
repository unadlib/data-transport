import {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';

// follow issue: https://github.com/microsoft/TypeScript/issues/20595
// workaround: `tsc --skipLibCheck`.
declare var self: ServiceWorkerGlobalScope;

interface ServiceWorkerClientId extends TransferableWorker {
  _clientId?: string;
}

export interface ServiceWorkerClientTransportOptions
  extends Partial<TransportOptions<TransferableWorker>> {
  /**
   * A service worker instance for data transport.
   */
  serviceWorker: ServiceWorker;
}

export interface ServiceWorkerServiceTransportOptions
  extends Partial<TransportOptions<ServiceWorkerClientId>> {}

abstract class ServiceWorkerClientTransport<T = {}> extends Transport<T> {
  constructor({
    serviceWorker,
    listener = (callback) => {
      const handler = ({
        data,
      }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
        callback(data);
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handler);
      };
    },
    sender = (message) => {
      const transfer = message.transfer ?? [];
      delete message.transfer;
      serviceWorker.postMessage(message, transfer);
    },
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
      const handler = ({
        data,
        source,
      }: MessageEvent<ListenerOptions<ServiceWorkerClientId>>) => {
        // TODO: fix source type
        data._clientId = (source as any).id as string;
        callback(data);
      };
      addEventListener('message', handler);
      return () => removeEventListener('message', handler);
    },
    sender = async (message) => {
      const transfer = message.transfer || [];
      delete message.transfer;
      if (message._clientId) {
        const client = await self.clients.get(message._clientId);
        if (!client) {
          console.warn(`The client "${message._clientId}" is closed.`);
          return;
        }
        delete message._clientId;
        client.postMessage(message, transfer);
        return;
      }

      // TODO: select a client for sender.
      self.clients
        .matchAll()
        .then((all) =>
          all.map((client) => client.postMessage(message, transfer))
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
