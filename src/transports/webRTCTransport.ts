// import Peer from 'simple-peer';
import { TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface WebRTCTransportOptions extends Partial<TransportOptions> {
  // peer: Peer.Instance;
  peer: any;
}

abstract class WebRTCTransport<T = {}> extends Transport<T> {
  constructor({
    peer,
    listener = (callback) => {
      peer.on('data', (data: any) => {
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
