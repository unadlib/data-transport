import {
  callbackKey,
  prefixKey,
  senderKey,
  transportKey,
  transportType,
} from '../src/constant';
import { getAction } from '../src/transport';
import {
  SharedWorkerClientTransport,
  SharedWorkerInternalTransport,
} from '../src/transports/sharedWorkerTransport';

describe('SharedWorkerTransport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('client transport handles connect handshake and pagehide disconnect', async () => {
    const messageListeners: Record<string, Function> = {};
    const worker = {
      port: {
        addEventListener: jest.fn((type: string, handler: Function) => {
          messageListeners[type] = handler;
        }),
        removeEventListener: jest.fn(),
        start: jest.fn(),
        postMessage: jest.fn(),
      },
    };

    class ClientTransport extends SharedWorkerClientTransport {}

    const transport = new ClientTransport({ worker: worker as any });

    expect(worker.port.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
    expect(worker.port.start).toHaveBeenCalled();
    expect(worker.port.postMessage).toHaveBeenCalled();

    const onConnect = jest.fn();
    const offConnect = transport.onConnect(onConnect);

    const actionPrefix = (transport as any)[prefixKey];
    const connectAction = getAction(actionPrefix, 'sharedworker-connect');

    const handler = messageListeners.message!;
    handler({
      data: {
        type: transportType.request,
        action: connectAction,
        hasRespond: true,
        request: [],
        requestId: 'client-42',
        [transportKey]: 'uuid-1',
      },
    });

    await Promise.resolve();
    expect(onConnect).toHaveBeenCalled();
    offConnect();

    const emitSpy = jest.spyOn(transport, 'emit');
    window.dispatchEvent(new Event('pagehide'));
    expect(emitSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'sharedworker-disconnect',
        respond: false,
      }),
      transport.id
    );

    const disposeHandler = messageListeners.message!;
    transport.dispose();
    expect(worker.port.removeEventListener).toHaveBeenCalledWith(
      'message',
      disposeHandler
    );
  });

  test('worker transport manages ports, broadcasts, and errors', async () => {
    const originalSelf = globalThis.self;
    let connectHandler: any;

    const addEventListenerMock = jest.fn((type: string, handler: any) => {
      if (type === 'connect') {
        connectHandler = handler;
      }
    });

    const selfMock = {
      addEventListener: addEventListenerMock,
      close: jest.fn(),
    };

    Object.defineProperty(globalThis, 'self', {
      value: selfMock,
      configurable: true,
    });

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    class WorkerTransport extends SharedWorkerInternalTransport {
      emitMock = jest.fn((options: any) => {
        if (options && options.respond === false) {
          return Promise.resolve(undefined);
        }
        return Promise.resolve('client-1');
      });

      emit(options: any) {
        return this.emitMock(options);
      }
    }

    const transport = new WorkerTransport();

    const messageHandlers: Function[] = [];
    const port: any = {
      addEventListener: jest.fn((type: string, handler: Function) => {
        if (type === 'message') {
          messageHandlers.push(handler);
          (port as any)._handler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    };

    const onConnect = jest.fn();
    transport.onConnect(onConnect);

    await connectHandler({ ports: [port] });

    expect(port.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
    expect(port.start).toHaveBeenCalled();
    expect(transport.emitMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sharedworker-connect' })
    );
    expect((transport as any).ports.get('client-1')).toBe(port);
    expect(onConnect).toHaveBeenCalledWith('client-1');

    const callbackSpy = jest.fn();
    (transport as any)[callbackKey] = callbackSpy;

    const prefix = (transport as any)[prefixKey];
    const connectAction = getAction(prefix, 'sharedworker-connect');
    const disconnectAction = getAction(prefix, 'sharedworker-disconnect');

    const messageHandler = messageHandlers[0];
    messageHandler({
      data: {
        type: transportType.request,
        action: connectAction,
        hasRespond: true,
        request: [],
        requestId: 'client-1',
        [transportKey]: 'uuid-connect',
      },
    });

    expect(transport.emitMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sharedworker-connect', respond: false })
    );
    expect(callbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: connectAction,
        _extra: expect.objectContaining({ _port: port }),
      })
    );

    const disconnectSpy = jest.fn();
    transport.onDisconnect(disconnectSpy);
    messageHandler({
      data: {
        type: transportType.request,
        action: disconnectAction,
        hasRespond: false,
        requestId: 'client-1',
        [transportKey]: 'uuid-disconnect',
      },
    });

    expect(disconnectSpy).toHaveBeenCalledWith('client-1');
    expect((transport as any).ports.has('client-1')).toBe(false);

    const directPort = { postMessage: jest.fn() };
    (transport as any)[senderKey]({
      _extra: { _port: directPort },
      transfer: ['buf'],
      type: transportType.request,
    });
    expect(directPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ _extra: {} }),
      ['buf']
    );

    const storedPort = { postMessage: jest.fn() };
    (transport as any).ports.set('resp', storedPort as any);
    (transport as any)[senderKey]({
      type: transportType.response,
      requestId: 'resp',
    });
    expect(storedPort.postMessage).toHaveBeenCalled();

    const broadcastPortA = { postMessage: jest.fn() };
    const broadcastPortB = { postMessage: jest.fn(() => { throw new Error('fail'); }) };
    const tempPort = { postMessage: jest.fn() };
    (transport as any).ports.set('a', broadcastPortA as any);
    (transport as any).ports.set('b', broadcastPortB as any);
    (transport as any).tempPorts.add(tempPort as any);

    (transport as any)[senderKey]({
      type: transportType.request,
      action: connectAction,
      transfer: ['x'],
    });

    expect(broadcastPortA.postMessage).toHaveBeenCalled();
    expect(tempPort.postMessage).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    transport.dispose();
    expect(selfMock.close).toHaveBeenCalled();

    if (typeof originalSelf === 'undefined') {
      delete (globalThis as any).self;
    } else {
      Object.defineProperty(globalThis, 'self', {
        value: originalSelf,
        configurable: true,
      });
    }
  });

  test('worker transport cleans up when connect handshake fails', async () => {
    const originalSelf = globalThis.self;
    let connectHandler: any;

    const selfMock = {
      addEventListener: jest.fn((type: string, handler: any) => {
        if (type === 'connect') {
          connectHandler = handler;
        }
      }),
      close: jest.fn(),
    };

    Object.defineProperty(globalThis, 'self', {
      value: selfMock,
      configurable: true,
    });

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    class ErrorWorkerTransport extends SharedWorkerInternalTransport {
      emitCalls = 0;

      emit(options: any) {
        this.emitCalls += 1;
        if (options && options.respond === false) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error('connect failed'));
      }
    }

    const transport = new ErrorWorkerTransport();

    const port: any = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    };

    await expect(connectHandler({ ports: [port] })).resolves.toBeUndefined();
    expect((transport as any).tempPorts.has(port)).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(expect.any(Error));

    if (typeof originalSelf === 'undefined') {
      delete (globalThis as any).self;
    } else {
      Object.defineProperty(globalThis, 'self', {
        value: originalSelf,
        configurable: true,
      });
    }
  });
});
