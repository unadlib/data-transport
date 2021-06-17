import { options } from 'yargs';
import { ListenerOptions, TransportOptions } from '../interface';
import { Transport } from '../transport';

export interface IFrameTransportInternalOptions
  extends Partial<TransportOptions> {
  /**
   * Specify what the origin of targetWindow must be for the event to be dispatched,
   * by default, it's the literal string "*" (indicating no preference).
   */
  targetOrigin?: string;
}

export interface IFrameMainTransportOptions extends Partial<TransportOptions> {
  /**
   * Pass an iframe for using data transport.
   */
  iframe?: HTMLIFrameElement;
  /**
   * Specify what the origin of targetWindow must be for the event to be dispatched,
   * by default, it's the literal string "*" (indicating no preference).
   */
  targetOrigin?: string;
}

abstract class IFrameMainTransport<T = {}> extends Transport<T> {
  constructor({
    iframe = undefined,
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
      if (iframe) {
        iframe.contentWindow!.postMessage(message, targetOrigin);
      } else if (window.frames[0]) {
        window.frames[0].postMessage(message, targetOrigin);
      } else {
        console.error('The current page does not have any iframe elements');
      }
    },
    ...options
  }: IFrameMainTransportOptions) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

abstract class IFrameInternalTransport<T = {}> extends Transport<T> {
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
    sender = (message) => window.parent.postMessage(message, targetOrigin),
    ...options
  }: IFrameTransportInternalOptions = {}) {
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export const IFrameTransport = {
  Main: IFrameMainTransport,
  IFrame: IFrameInternalTransport,
};
