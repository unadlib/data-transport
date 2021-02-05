import { ListenCallback, SendOptions } from './interface';

/**
 * mockPorts as testing mock
 */
export const mockPorts = () => {
  const mock: {
    internalSend?: ListenCallback;
    externalSend?: ListenCallback;
  } = {};
  return [
    {
      listener: (callback: ListenCallback) => {
        mock.internalSend = callback;
      },
      sender: (message: SendOptions) => {
        mock.externalSend?.(JSON.parse(JSON.stringify(message)));
      },
    },
    {
      listener: (callback: ListenCallback) => {
        mock.externalSend = callback;
      },
      sender: (message: SendOptions) => {
        mock.internalSend?.(JSON.parse(JSON.stringify(message)));
      },
    },
  ];
};
