import type { ChildProcess } from 'child_process';
import type {
  BaseInteraction,
  ListenerOptions,
  TransportOptions,
} from '../interface';
import { Transport } from '../transport';

export interface MainProcessTransportOptions extends Partial<TransportOptions> {
  child: ChildProcess;
}

export class MainProcessTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: MainProcessTransportOptions) {
    const {
      child,
      listener = (callback) => {
        const handler = (data: ListenerOptions) => {
          callback(data);
        };
        child.on('message', handler);
        return () => {
          child.off('message', handler);
        };
      },
      sender = (message) => {
        child.send(message);
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

export interface ChildProcessTransportOptions
  extends Partial<TransportOptions> {
  //
}

export class ChildProcessTransport<
  T extends BaseInteraction = any
> extends Transport<T> {
  constructor(_options: ChildProcessTransportOptions = {}) {
    const {
      listener = (callback) => {
        const handler = (data: ListenerOptions) => {
          callback(data);
        };
        process.on('message', handler);
        return () => {
          process.off('message', handler);
        };
      },
      sender = (message) => {
        // @ts-ignore
        process.send(message);
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

export const ProcessTransport = {
  Main: MainProcessTransport,
  Child: ChildProcessTransport,
};
