import { TransportDataMap, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface BroadcastTransportOptions extends Partial<TransportOptions> {
  broadcastChannel: BroadcastChannel;
}

abstract class BroadcastTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    broadcastChannel,
    listener = (callback) => {
      broadcastChannel.onmessage = ({ data }) => {
        callback(data);
      };
    },
    sender = (message) => broadcastChannel.postMessage(message),
  }: BroadcastTransportOptions) {
    super({
      listener,
      sender,
    });
  }
}

export { BroadcastTransport };
