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
    listen = (callback) => {
      broadcastChannel.onmessage = ({ data }) => {
        callback(data);
      };
    },
    send = (message: any) => broadcastChannel.postMessage(message),
  }: BroadcastTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

export { BroadcastTransport };
