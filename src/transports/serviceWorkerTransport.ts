import {
  TransportOptions,
  TransferableWorker,
  ListenerOptions,
} from '../interface';
import { Transport } from '../transport';
import { detectSafari } from '../utils';

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
  /**
   * Compatibility with unstable serialization in Safari
   */
  useOnSafari?: boolean;
}

export interface ServiceWorkerServiceTransportOptions
  extends Partial<TransportOptions<ServiceWorkerClientId>> {
  /**
   * Compatibility with unstable serialization in Safari
   */
  useOnSafari?: boolean;
}

const DEFAULT_USE_ON_SAFARI = true;

const decode = (data: any, useOnSafari: boolean) => {
  try {
    return useOnSafari && detectSafari() ? JSON.stringify(data) : data;
  } catch (e) {
    console.error(`Failed to stringify:`, data);
    throw e;
  }
};

const encode = (data: any, useOnSafari: boolean) => {
  try {
    return typeof data === 'string' && useOnSafari && detectSafari()
      ? JSON.parse(data as any)
      : data;
  } catch (e) {
    console.error(`Failed to parse:`, data);
  }
  return data;
};

export abstract class ServiceWorkerClientTransport<
  T = any,
  P = any
> extends Transport<T, P> {
  constructor({
    serviceWorker,
    useOnSafari = DEFAULT_USE_ON_SAFARI,
    listener = (callback) => {
      const handler = ({
        data,
      }: MessageEvent<ListenerOptions<TransferableWorker>>) => {
        callback(encode(data, useOnSafari));
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
    ...options
  }: ServiceWorkerClientTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export abstract class ServiceWorkerServiceTransport<
  T = any,
  P = any
> extends Transport<T, P> {
  constructor({
    useOnSafari = DEFAULT_USE_ON_SAFARI,
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
      const data = decode(message, useOnSafari);
      if (message._clientId) {
        const client = await self.clients.get(message._clientId);
        if (!client) {
          console.warn(`The client "${message._clientId}" is closed.`);
          return;
        }
        delete message._clientId;
        client.postMessage(data, transfer);
        return;
      }

      // TODO: select a client for sender.
      self.clients
        .matchAll()
        .then((all) => all.map((client) => client.postMessage(data, transfer)));
    },
    ...options
  }: ServiceWorkerServiceTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });
  }
}

export const ServiceWorkerTransport = {
  Client: ServiceWorkerClientTransport,
  Service: ServiceWorkerServiceTransport,
};
