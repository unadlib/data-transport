import {
  ListenOptions,
  TransportDataMap,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

export interface IFrameTransportOptions extends Partial<TransportOptions> {
  /**
   * Specify what the origin of targetWindow must be for the event to be dispatched,
   * by default, it's the literal string "*" (indicating no preference).
   */
  targetOrigin?: string;
}

export interface IFrameMainTransportOptions extends IFrameTransportOptions {
  /**
   * Pass an iframe for using data transport.
   */
  iframe?: HTMLIFrameElement;
}

abstract class IFrameMainTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    iframe = undefined,
    targetOrigin = '*',
    listen = (callback) => {
      window.addEventListener('message', ({ data }: MessageEvent<any>) =>
        callback(data)
      );
    },
    send = (message) => {
      if (iframe) {
        iframe.contentWindow!.postMessage(message, targetOrigin);
      } else if (window.frames[0]) {
        window.frames[0].postMessage(message, targetOrigin);
      } else {
        console.error('The current page does not have any iframe elements');
      }
    },
  }: IFrameMainTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

abstract class IFrameInternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    targetOrigin = '*',
    listen = (callback) => {
      window.addEventListener('message', ({ data }: MessageEvent<any>) =>
        callback(data)
      );
    },
    send = (message: any) => window.parent.postMessage(message, targetOrigin),
  }: IFrameTransportOptions = {}) {
    super({
      listen,
      send,
    });
  }
}

export const IFrameTransport = {
  Main: IFrameMainTransport,
  IFrame: IFrameInternalTransport,
};
