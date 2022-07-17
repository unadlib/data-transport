import { listenerKey, senderKey } from './constant';
import { createTransport } from './createTransport';
import type { ListenerOptions } from './interface';
import { Transport } from './transport';

export const merge = (...args: Transport[]) => {
  if (args.length < 1) {
    throw new Error(`Only more than one transports can be merged.`);
  }
  return createTransport('Base', {
    listener: (callback) => {
      const handler = (data: ListenerOptions) => {
        callback(data);
      };
      const disposers = args.map((transport) =>
        transport[listenerKey](handler)
      );
      return () => {
        disposers.forEach((dispose) => dispose && dispose());
      };
    },
    sender: (message) => {
      args.forEach((transport) => {
        transport[senderKey](message);
      });
    },
  });
};
