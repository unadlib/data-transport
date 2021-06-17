import { ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface MessageTransportOptions extends Partial<TransportOptions> {
  /**
   * Specify what the origin of targetWindow must be for the event to be dispatched,
   * by default, it's the literal string "*" (indicating no preference).
   */
  targetOrigin?: string;
}

abstract class MessageTransport<T = {}> extends Transport<T> {
  constructor({
    targetOrigin = '*',
    listener = (callback) => {
      const handler = ({ data }: MessageEvent<ListenerOptions>) =>
        callback(data);
      window.addEventListener('message', handler);
      return () => {
        window.removeEventListener('message', handler);
      };
    },
    sender = (message) => {
      window.postMessage(message, targetOrigin);
    },
    ...options
  }: MessageTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export { MessageTransport };
