import { ListenOptions, TransportDataMap, TransportOptions } from './interface';
import { Transport } from './transport';

export interface IFrameTransportOptions extends Partial<TransportOptions> {
  targetOrigin?: string;
}

export interface IFrameExternalTransportOptions extends IFrameTransportOptions {
  iframe: HTMLIFrameElement;
}

class IFrameExternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    iframe,
    targetOrigin = '*',
    listen = (callback) => {
      window.addEventListener('message', ({ data }: MessageEvent<any>) =>
        callback(data)
      );
    },
    send = (message: any) =>
      iframe.contentWindow!.postMessage(message, targetOrigin),
  }: IFrameExternalTransportOptions) {
    super({
      listen,
      send,
    });
  }
}

class IFrameInternalTransport<
  T extends TransportDataMap = any
> extends Transport<T> {
  constructor({
    targetOrigin = '*',
    listen = (callback: (options: ListenOptions) => void) => {
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
  External: IFrameExternalTransport,
  Internal: IFrameInternalTransport,
};
