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
    listen = (callback) => {
      peer.on('data', (data) => {
        callback(JSON.parse(data));
      });
    },
    send = (message) => {
      peer.send(JSON.stringify(message));
    },
  }: WebRTCTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

export { WebRTCTransport };
