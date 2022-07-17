import type { Instance } from 'simple-peer';
import type { ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface WebRTCTransportOptions extends Partial<TransportOptions> {
  peer: Instance;
}

abstract class WebRTCTransport<T = any, P = any> extends Transport<T, P> {
  constructor({
    peer,
    listener = (callback) => {
      const handler = (data: string) => {
        callback(JSON.parse(data) as ListenerOptions);
      };
      peer.on('data', handler);
      return () => {
        peer.off('data', handler);
      };
    },
    sender = (message) => {
      peer.send(JSON.stringify(message));
    },
    ...options
  }: WebRTCTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export { WebRTCTransport };
