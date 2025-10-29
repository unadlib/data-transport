import {
  beforeEmitKey,
  senderKey,
  transportKey,
  transportType,
} from '../src/constant';
import { IFrameTransport } from '../src/transports/iframeTransport';
import { listen } from '../src/decorators';

describe('IFrameTransport', () => {
  const originalWindowAdd = window.addEventListener;
  const originalWindowRemove = window.removeEventListener;
  const originalParent = window.parent;
  const originalFramesDescriptor = Object.getOwnPropertyDescriptor(
    window,
    'frames'
  );

  afterEach(() => {
    window.addEventListener = originalWindowAdd;
    window.removeEventListener = originalWindowRemove;
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      configurable: true,
    });
    if (originalFramesDescriptor) {
      Object.defineProperty(window, 'frames', originalFramesDescriptor);
    } else {
      delete (window as any).frames;
    }
    jest.restoreAllMocks();
  });

  test('main and internal transports communicate without connection checks', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    const mockIframe = {
      contentWindow: {
        postMessage: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    const parentPostMessage = jest.fn();
    Object.defineProperty(window, 'parent', {
      value: { postMessage: parentPostMessage },
      configurable: true,
    });

    const messageListeners: Function[] = [];
    window.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'message') {
        messageListeners.push(handler);
      }
      return originalWindowAdd.call(window, event as any, handler);
    }) as any;
    window.removeEventListener = jest.fn() as any;

    mockIframe.contentWindow.postMessage = jest.fn((message: any) => {
      const handler = messageListeners[1];
      handler?.({
        data: message,
        source: window as any,
      });
    });
    parentPostMessage.mockImplementation((message: any) => {
      const handler = messageListeners[0];
      handler?.({
        data: message,
        source: mockIframe.contentWindow,
      });
    });

    class MainTransport extends IFrameTransport.Main<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return this.emit('hello', options);
      }
    }

    class InternalTransport extends IFrameTransport.IFrame implements Internal {
      @listen
      async hello(options: { num: number }) {
        return { text: `hello ${options.num}` };
      }
    }

    const main = new MainTransport({
      iframe: mockIframe as any,
      skipConnectionCheck: true,
    });
    const internal = new InternalTransport({
      skipConnectionCheck: true,
    });

    const result = await main.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });

    main.dispose();
    internal.dispose();
    expect(window.removeEventListener).toHaveBeenCalled();
    expect(mockIframe.contentWindow.postMessage).toHaveBeenCalled();
    expect(parentPostMessage).toHaveBeenCalled();
  });

  test('IFrameMainTransport performs handshake and reconnect on load', async () => {
    const iframe = {
      contentWindow: {
        postMessage: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    const emitSpy = jest.fn().mockResolvedValue(true);
    let connectHandler: (() => Promise<boolean>) | undefined;
    const windowMessageHandlers: Function[] = [];

    window.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'message') {
        windowMessageHandlers.push(handler);
      }
    }) as any;
    window.removeEventListener = jest.fn() as any;

    class TestMainTransport extends IFrameTransport.Main {
      emit(options: any, ...args: any[]) {
        return emitSpy(options, ...args);
      }

      listen(name: any, fn: any) {
        if (name === 'iframe-connect') {
          connectHandler = fn;
        }
        return super.listen(name, fn);
      }
    }

    const transport = new TestMainTransport({ iframe: iframe as any });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'iframe-connect',
        silent: true,
        skipBeforeEmit: true,
      })
    );

    const loadHandler =
      iframe.addEventListener.mock.calls.find(
        ([event]) => event === 'load'
      )?.[1] ?? fail('load handler not registered');
    loadHandler();
    expect(emitSpy).toHaveBeenCalledTimes(2);

    const beforePromise = (transport as any)[beforeEmitKey];
    expect(beforePromise).toBeInstanceOf(Promise);
    await connectHandler?.();
    await expect(beforePromise).resolves.toBeUndefined();

    const messageHandler = windowMessageHandlers[0];
    expect(typeof messageHandler).toBe('function');
    messageHandler({
      data: {
        type: transportType.request,
        action: 'DataTransport-ignore',
        hasRespond: false,
        [transportKey]: 'uuid',
      },
      source: {},
    });
    messageHandler({
      data: {
        type: transportType.request,
        action: 'DataTransport-ignore',
        hasRespond: false,
        [transportKey]: 'uuid',
      },
      source: iframe.contentWindow,
    });

    (transport as any)[senderKey]({
      type: transportType.request,
      payload: 'data',
    });
    expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ payload: 'data' }),
      '*'
    );

    transport.dispose();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      messageHandler
    );
  });

  test('IFrameMainTransport falls back to window.frames and logs errors without targets', () => {
    const frameWindow = { postMessage: jest.fn() };
    Object.defineProperty(window, 'frames', {
      value: [frameWindow],
      configurable: true,
    });

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    class FramesTransport extends IFrameTransport.Main {}
    const transport = new FramesTransport({
      iframe: null as any,
      skipConnectionCheck: true,
    });
    (transport as any)[senderKey]({
      type: transportType.request,
    });
    expect(frameWindow.postMessage).toHaveBeenCalled();

    Object.defineProperty(window, 'frames', {
      value: [],
      configurable: true,
    });
    (transport as any)[senderKey]({
      type: transportType.request,
    });
    expect(consoleError).toHaveBeenCalledWith(
      'The current page does not have any iframe elements'
    );
  });

  test('IFrameInternalTransport handshake resolves before emit and uses targetOrigin', async () => {
    const parentPostMessage = jest.fn();
    Object.defineProperty(window, 'parent', {
      value: { postMessage: parentPostMessage },
      configurable: true,
    });

    const emitSpy = jest.fn().mockResolvedValue(true);
    let connectHandler: (() => Promise<boolean>) | undefined;
    const windowHandlers: Function[] = [];

    window.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'message') {
        windowHandlers.push(handler);
      }
    }) as any;
    window.removeEventListener = jest.fn() as any;

    class TestInternalTransport extends IFrameTransport.IFrame {
      emit(options: any, ...args: any[]) {
        return emitSpy(options, ...args);
      }

      listen(name: any, fn: any) {
        if (name === 'iframe-connect') {
          connectHandler = fn;
        }
        return super.listen(name, fn);
      }
    }

    const transport = new TestInternalTransport({ targetOrigin: 'https://a' });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'iframe-connect',
        silent: true,
      })
    );

    const beforePromise = (transport as any)[beforeEmitKey];
    expect(beforePromise).toBeInstanceOf(Promise);
    await connectHandler?.();
    await expect(beforePromise).resolves.toBeUndefined();

    (transport as any)[senderKey]({
      type: transportType.request,
      transfer: ['buffer'],
    });
    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ transfer: ['buffer'] }),
      'https://a'
    );

    const handler = windowHandlers[0];
    handler?.({
      data: {
        type: transportType.response,
        action: 'DataTransport-test',
        hasRespond: false,
        [transportKey]: 'uuid',
      },
    });

    transport.dispose();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      handler
    );
  });
});
