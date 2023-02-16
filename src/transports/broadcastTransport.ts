import type { BaseInteraction, ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

const defaultChannel = '$$BroadcastChannel_Transport$$';

export interface BroadcastTransportOptions extends Partial<TransportOptions> {
  /**
   * Specify a broadcast channel name.
   */
  channel?: string;
  /**
   * Specify a broadcast channel instance.
   */
  broadcastChannel?: BroadcastChannel;
}

abstract class BroadcastTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor({
    channel = defaultChannel,
    broadcastChannel = new BroadcastChannel(channel),
    listener = (callback) => {
      const handler = ({ data }: MessageEvent<ListenerOptions>) => {
        callback(data);
      };
      broadcastChannel.addEventListener('message', handler);
      return () => {
        broadcastChannel.removeEventListener('message', handler);
      };
    },
    sender = (message) => broadcastChannel.postMessage(message),
    ...options
  }: BroadcastTransportOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export { BroadcastTransport };
