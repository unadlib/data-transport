import type { Instance } from 'simple-peer';
import { ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface WebRTCTransportOptions extends Partial<TransportOptions> {
  peer: Instance;
}

abstract class WebRTCTransport<T = {}> extends Transport<T> {
  constructor({
    peer,
    listener = (callback) => {
      peer.on('data', (data: string) => {
        callback(JSON.parse(data) as ListenerOptions);
      });
    },
    sender = (message) => {
      peer.send(JSON.stringify(message));
    },
  }: WebRTCTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

export { WebRTCTransport };
