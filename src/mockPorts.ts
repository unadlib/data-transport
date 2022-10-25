import type { ListenCallback, SendOptions } from './interface';

/**
 * Mock ports for testing
 */
export const mockPorts = () => {
  let emitter = new Set<(data: any) => void>();
  let mainCallback: null | ListenCallback = null;
  return {
    main: {
      listener: (callback: ListenCallback) => {
        mainCallback = callback;
        return () => {
          mainCallback = null;
        };
      },
      sender: (message: SendOptions) => {
        for (const emit of emitter) {
          emit(JSON.parse(JSON.stringify(message)));
        }
      },
    },
    create: () => ({
      listener: (callback: ListenCallback) => {
        emitter.add(callback);
        return () => {
          emitter.delete(callback);
        };
      },
      sender: (message: SendOptions) => {
        mainCallback?.(JSON.parse(JSON.stringify(message)));
      },
    }),
  };
};
