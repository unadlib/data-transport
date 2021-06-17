import { ListenCallback, SendOptions } from './interface';

/**
 * Mock a pair of ports for testing
 */
export const mockPairPorts = () => {
  const mock: {
    internalSend?: ListenCallback;
    externalSend?: ListenCallback;
  } = {};
  return [
    {
      listener: (callback: ListenCallback) => {
        mock.internalSend = callback;
        return () => {
          mock.internalSend = undefined;
        };
      },
      sender: (message: SendOptions) => {
        mock.externalSend?.(JSON.parse(JSON.stringify(message)));
      },
    },
    {
      listener: (callback: ListenCallback) => {
        mock.externalSend = callback;
        return () => {
          mock.externalSend = undefined;
        };
      },
      sender: (message: SendOptions) => {
        mock.internalSend?.(JSON.parse(JSON.stringify(message)));
      },
    },
  ];
};
