import type {
  BaseInteraction,
  ListenerOptions,
  TransportOptions,
} from '../interface';
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

export abstract class IFrameMainTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: IFrameMainTransportOptions) {
    const {
      iframe = undefined,
      targetOrigin = '*',
      listener = (callback) => {
        const handler = ({ data, source }: MessageEvent<ListenerOptions>) => {
          const contentWindow = iframe?.contentWindow ?? window.frames[0];
          if (contentWindow && contentWindow === (source as any)) {
            return callback(data);
          }
        };
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
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
  }
}

export abstract class IFrameInternalTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: IFrameTransportInternalOptions = {}) {
    const {
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
    } = _options;
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
