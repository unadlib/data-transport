import {
  beforeEmitKey,
  listensMapKey,
  senderKey,
  transportKey,
  transportType,
} from '../src/constant';
import { getAction, Transport } from '../src/transport';
import type { TransportOptions } from '../src/interface';

const originalDev = (global as any).__DEV__;

const setupTransport = (
  options: Partial<TransportOptions> = {}
): {
  transport: Transport<any>;
  trigger: (options: any) => void;
  sender: jest.Mock;
  dispose: jest.Mock;
} => {
  let trigger: (options: any) => void = () => {};
  const dispose = jest.fn();
  const sender = options.sender
    ? (options.sender as jest.Mock)
    : jest.fn();

  class TestTransport extends Transport<any> {}

  const transport = new TestTransport({
    listener: options.listener
      ? options.listener
      : (callback) => {
          trigger = callback;
          return dispose;
        },
    sender,
    ...options,
  });

  return { transport, trigger, sender, dispose };
};

describe('Transport base class', () => {
  beforeEach(() => {
    (global as any).__DEV__ = true;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    jest.useRealTimers();
  });

  test('warns when listenKeys contain non-functions and guards direct calls', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    class ListenKeyTransport extends Transport<any> {
      badListener = 42;
    }

    const transport = new ListenKeyTransport({
      listener: () => undefined,
      sender: jest.fn(),
      listenKeys: ['badListener'],
    });

    expect(warn).toHaveBeenCalledWith("'badListener' is NOT a methods or function.");

    warn.mockClear();
    transport.dispose();
    expect(warn).toHaveBeenCalledWith(
      "The return value of the the 'ListenKeyTransport' transport's listener should be a 'dispose' function for removing the listener"
    );

    class GuardedTransport extends Transport<any> {
      guarded() {
        return 'ok';
      }
    }

    const guarded = new GuardedTransport({
      listener: () => jest.fn(),
      sender: jest.fn(),
      listenKeys: ['guarded'],
    });

    expect(() => guarded.guarded()).toThrow(
      "The method 'guarded' is a listen function that can NOT be actively called."
    );
  });

  test('listen enforces uniqueness, function requirement, and string event names', () => {
    const { transport } = setupTransport();

    const off = transport.listen('alpha', async () => 'ok');
    expect(() => transport.listen('alpha', async () => 'duplicate')).toThrow(
      'Failed to listen to the event "alpha", the event "alpha" is already listened to.'
    );

    expect(() => transport.listen('beta', undefined as any)).toThrow(
      'The listener for event beta should be a function.'
    );

    expect(() =>
      transport.listen(Symbol('event') as any, async () => undefined)
    ).toThrow('The event name "Symbol(event)" is not a string, it should be a string.');

    off();
  });

  test('listener warns when unregistered handler receives request or response', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { transport, trigger } = setupTransport();

    (transport as any).orphan = jest.fn();

    trigger({
      type: transportType.request,
      action: getAction('DataTransport', 'orphan'),
      hasRespond: true,
      request: [],
      requestId: 'req',
      [transportKey]: 'transport-1',
    });

    expect(error).toHaveBeenCalledWith(
      "The listen method or function 'orphan' is NOT decorated by decorator '@listen' or be added 'listenKeys' list."
    );

    trigger({
      type: transportType.response,
      action: getAction('DataTransport', 'orphan'),
      hasRespond: true,
      response: undefined,
      requestId: 'req',
      [transportKey]: 'transport-2',
    });

    expect(warn).toHaveBeenCalledWith(
      "The type 'DataTransport-orphan' event 'transport-2' has been resolved. Please check for a duplicate response."
    );
  });

  test('emit serializes requests, parses responses, and clears pending map', async () => {
    const { transport, trigger, sender } = setupTransport({
      serializer: {
        stringify: jest.fn(JSON.stringify),
        parse: jest.fn(JSON.parse),
      },
    });

    sender.mockImplementation((message) => {
      trigger({
        type: transportType.response,
        action: message.action,
        response: JSON.stringify({ ack: true }),
        hasRespond: true,
        requestId: 'req',
        [transportKey]: message[transportKey],
      });
    });

    const result = await transport.emit('ping', { payload: 1 });
    expect(result).toEqual({ ack: true });
    expect(sender).toHaveBeenCalled();
    expect((transport as any)[listensMapKey]).toBeDefined();
  });

  test('emit obeys verbose logger and fallback info logging', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const logSpy = jest.fn();
    const { transport } = setupTransport({
      verbose: true,
      logger: logSpy,
    });

    await transport.emit({ name: 'noop', respond: false });
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DataTransport-noop' })
    );

    const { transport: infoTransport } = setupTransport({
      verbose: true,
    });
    await infoTransport.emit({ name: 'noop', respond: false });
    expect(info).toHaveBeenCalledWith(
      'DataTransport Send: ',
      expect.objectContaining({ action: 'DataTransport-noop' })
    );
  });

  test('emit warns on timeout when no response arrives', async () => {
    jest.useFakeTimers();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { transport } = setupTransport({
      timeout: 20,
      sender: jest.fn(),
    });

    const promise = transport.emit('timeout');
    jest.advanceTimersByTime(21);
    await Promise.resolve();
    await expect(promise).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "The event 'DataTransport-timeout' timed out for 20 seconds...",
      expect.any(Object)
    );
  });


  test('emit waits for beforeEmit when respond is false', async () => {
    const { transport, sender } = setupTransport({
      sender: jest.fn(),
    });

    const beforePromise = Promise.resolve();
    (transport as any)[beforeEmitKey] = beforePromise;

    await transport.emit({ name: 'fire', respond: false });
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DataTransport-fire' })
    );
  });
});
