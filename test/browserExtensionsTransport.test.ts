import {
  BrowserExtensionsGenericTransport,
  BrowserExtensionsMainTransport,
  BrowserExtensionsClientTransport,
} from '../src/transports/browserExtensionsTransport';
import {
  transportKey,
  transportType,
  senderKey,
} from '../src/constant';

describe('BrowserExtensions transports', () => {
  test('BrowserExtensionsGenericTransport handles request-response cycle', async () => {
    const messageListeners = new Set<
      (data: any, sender: unknown, respond: (response: any) => void) => void
    >();

    const removeListener = jest.fn((handler: any) => {
      messageListeners.delete(handler);
    });

    const browser = {
      runtime: {
        onMessage: {
          addListener: (handler: any) => {
            messageListeners.add(handler);
          },
          removeListener,
        },
        sendMessage: jest.fn((_message: any, _options: object, respond: any) => {
          if (typeof respond === 'function') {
            respond({
              type: transportType.response,
            });
          }
        }),
      },
    };

    class GenericTransport extends BrowserExtensionsGenericTransport {}

    const transport = new GenericTransport({ browser: browser as any });

    transport.listen('ping', async () => 'pong');

    const [messageHandler] = Array.from(messageListeners);
    const sendResponse = jest.fn();
    const request = {
      type: transportType.request,
      action: 'DataTransport-ping',
      request: [],
      hasRespond: true,
      [transportKey]: 'uuid',
      requestId: 'req-1',
    };

    messageHandler(request, {}, sendResponse);

    await Promise.resolve();

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        type: transportType.response,
        action: 'DataTransport-ping',
        response: 'pong',
      })
    );

    await transport.emit({ name: 'ping', respond: false });
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.any(Object),
      {},
      expect.any(Function)
    );

    transport.dispose();
    expect(removeListener).toHaveBeenCalledWith(messageHandler);
  });

  test('BrowserExtensionsMainTransport manages ports and dispatches messages', async () => {
    const onMessageCallbacks: any[] = [];
    const onDisconnectCallbacks: any[] = [];

    const port = {
      name: '__DATA_TRANSPORT_BROWSER_EXTENSIONS__',
      onMessage: {
        addListener: (handler: any) => {
          onMessageCallbacks.push(handler);
        },
        removeListener: jest.fn(),
      },
      onDisconnect: {
        addListener: (handler: any) => {
          onDisconnectCallbacks.push(handler);
        },
        removeListener: jest.fn(),
      },
      postMessage: jest.fn(),
      disconnect: jest.fn(),
    };

    const runtime = {
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onConnect: {
        addListener: jest.fn(),
      },
      sendMessage: jest.fn(),
    };

    const browser = { runtime };

    class TestMainTransport extends BrowserExtensionsMainTransport {
      async emit(options: any, ...args: any[]) {
        if (
          typeof options === 'object' &&
          options?.name === 'sharedworker-connect'
        ) {
          return 'client-1';
        }
        return super.emit(options as never, ...args);
      }
    }

    const transport = new TestMainTransport({ browser: browser as any });
    const onConnectSpy = jest.fn();
    const onDisconnectSpy = jest.fn();

    const offConnect = transport.onConnect(onConnectSpy);
    const offDisconnect = transport.onDisconnect(onDisconnectSpy);

    const connectHandler = runtime.onConnect.addListener.mock.calls[0][0];
    await connectHandler(port as any);

    expect(onConnectSpy).toHaveBeenCalledWith('client-1');
    expect((transport as any).ports.get('client-1')).toBe(port);

    const message = {
      type: transportType.request,
      action: 'DataTransport-ping',
      hasRespond: false,
      _extra: { _port: port },
    };

    (transport as any)[senderKey](message);
    expect(port.postMessage).toHaveBeenLastCalledWith(message);

    const responseMessage = {
      type: transportType.response,
      requestId: 'client-1',
    };
    (transport as any)[senderKey](responseMessage);
    expect(port.postMessage).toHaveBeenCalledWith(responseMessage);

    const broadcastMessage = {
      type: transportType.request,
      action: 'DataTransport-broadcast',
    };
    (transport as any)[senderKey](broadcastMessage);
    expect(port.postMessage).toHaveBeenCalledWith(broadcastMessage);

    onDisconnectCallbacks[0]();
    expect(onDisconnectSpy).toHaveBeenCalledWith('client-1');
    expect((transport as any).ports.size).toBe(0);
    offConnect();
    offDisconnect();

    (transport as any).ports.set('client-1', port);
    transport.dispose();
    expect(port.disconnect).toHaveBeenCalled();
  });

  test('BrowserExtensionsClientTransport responds to connect events', async () => {
    const onMessageCallbacks: any[] = [];

    const port = {
      onMessage: {
        addListener: (handler: any) => {
          onMessageCallbacks.push(handler);
        },
        removeListener: jest.fn(),
      },
      postMessage: jest.fn(),
    };

    const browser = {
      runtime: {
        connect: jest.fn(() => port),
      },
    };

    class ClientTransport extends BrowserExtensionsClientTransport {}

    const transport = new ClientTransport({ browser: browser as any });
    const onConnectSpy = jest.fn();
    const off = transport.onConnect(onConnectSpy);

    const connectRequest = {
      type: transportType.request,
      action: 'DataTransport-sharedworker-connect',
      hasRespond: true,
      [transportKey]: 'transport-id',
      requestId: 'req-1',
      request: [],
    };

    onMessageCallbacks[0](connectRequest);
    await Promise.resolve();

    expect(port.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: transportType.response,
        response: transport.id,
      })
    );

    await Promise.resolve();
    expect(onConnectSpy).toHaveBeenCalled();

    await transport.emit({ name: 'custom-event', respond: false });
    expect(port.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DataTransport-custom-event',
      })
    );

    off();
    transport.dispose();
    expect(port.onMessage.removeListener).toHaveBeenCalledWith(
      onMessageCallbacks[0]
    );
  });
});
