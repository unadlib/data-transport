import { beforeEmitKey, beforeEmitResolveKey } from '../constant';
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
  /**
   * Whether skip connection check, false by default.
   */
  skipConnectionCheck?: boolean;
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
  /**
   * Whether skip connection check, false by default.
   */
  skipConnectionCheck?: boolean;
}

const connectEventName = 'iframe-connect';

export abstract class IFrameMainTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: IFrameMainTransportOptions) {
    const {
      iframe = document.querySelector('iframe'),
      targetOrigin = '*',
      listener = (callback) => {
        const handler = ({ data, source }: MessageEvent<ListenerOptions>) => {
          const contentWindow = iframe!.contentWindow;
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
      skipConnectionCheck,
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
    if (!skipConnectionCheck) {
      const connect = () => {
        this.emit({
          // @ts-ignore
          name: connectEventName,
          silent: true,
          skipBeforeEmit: true,
        }).then((connected) => {
          if (connected) {
            this[beforeEmitResolveKey]!();
          }
        });
      };
      connect();
      this[beforeEmitKey] = new Promise((resolve) => {
        this[beforeEmitResolveKey] = resolve;
      });
      // @ts-ignore
      this.listen(connectEventName, async () => {
        this[beforeEmitResolveKey]!();
        return true;
      });
      // for iframe reload
      iframe?.addEventListener('load', () => {
        this[beforeEmitKey] = new Promise((resolve) => {
          this[beforeEmitResolveKey] = resolve;
        });
        connect();
      });
    }
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
      skipConnectionCheck,
      ...options
    } = _options;
    super({
      ...options,
      listener,
      sender,
    });
    if (!skipConnectionCheck) {
      this.emit({
        // @ts-ignore
        name: connectEventName,
        silent: true,
      }).then((connected) => {
        if (connected) {
          this[beforeEmitResolveKey]!();
        }
      });
      this[beforeEmitKey] = new Promise((resolve) => {
        this[beforeEmitResolveKey] = resolve;
      });
      // @ts-ignore
      this.listen(connectEventName, async () => {
        this[beforeEmitResolveKey]!();
        return true;
      });
    }
  }
}

export const IFrameTransport = {
  Main: IFrameMainTransport,
  IFrame: IFrameInternalTransport,
};
