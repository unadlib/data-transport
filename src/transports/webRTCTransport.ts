import Peer from 'simple-peer';
import { TransportDataMap, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface WebRTCTransportOptions extends Partial<TransportOptions> {
  peer: Peer.Instance;
}

abstract class WebRTCTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    peer,
    listener = (callback) => {
      peer.on('data', (data) => {
        callback(JSON.parse(data));
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
