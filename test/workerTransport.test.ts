import { senderKey } from '../src/constant';
import { WorkerTransport } from '../src/transports/workerTransport';

describe('WorkerTransport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    if ('self' in globalThis) {
      delete (globalThis as any).self;
    }
    if ('postMessage' in globalThis) {
      delete (globalThis as any).postMessage;
    }
  });

  test('WorkerMainTransport wires listeners, handshake, and onConnect lifecycle', async () => {
    let messageHandler: any;
    const mockWorker = {
      addEventListener: jest.fn((event: string, handler: any) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
    };

    const emitSpy = jest.fn().mockResolvedValue(undefined);
    class TestMainTransport extends WorkerTransport.Main {
      emit(options: any, ...args: any[]) {
        return emitSpy(options, ...args);
      }
    }

    const transport = new TestMainTransport({
      worker: mockWorker as any,
    });

    expect(mockWorker.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'worker-connect',
        respond: true,
        silent: true,
      })
    );

    const disposer = transport.onConnect(jest.fn());
    await (transport as any)._handleConnectCallbacks();
    expect(
      (transport as any)._onConnectCallback.size
    ).toBe(0);

    const immediateCallback = jest.fn();
    transport.onConnect(immediateCallback);
    expect(immediateCallback).toHaveBeenCalled();

    if (typeof disposer === 'function') {
      disposer();
    }
    await (transport as any)._handleConnectCallbacks();

    (transport as any)[senderKey]({
      type: 'request',
      transfer: ['buffer'],
      payload: { foo: 'bar' },
    });
    const [mainMessage, mainTransfer] =
      mockWorker.postMessage.mock.calls.slice(-1)[0];
    expect(mainMessage).not.toHaveProperty('transfer');
    expect(mainTransfer).toEqual(['buffer']);

    transport.dispose();
    expect(mockWorker.removeEventListener).toHaveBeenCalledWith(
      'message',
      messageHandler
    );
  });

  test('WorkerInternalTransport uses global self listeners and onConnect handling', async () => {
    let messageHandler: any;
    const selfMock = {
      addEventListener: jest.fn((event: string, handler: any) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(globalThis, 'self', {
      value: selfMock,
      configurable: true,
    });
    const postMessageMock = jest.fn();
    Object.defineProperty(globalThis, 'postMessage', {
      value: postMessageMock,
      configurable: true,
    });

    const emitSpy = jest.fn().mockResolvedValue(undefined);
    class TestWorkerTransport extends WorkerTransport.Worker {
      emit(options: any, ...args: any[]) {
        return emitSpy(options, ...args);
      }
    }

    const transport = new TestWorkerTransport({});
    expect(selfMock.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'worker-connect',
        respond: true,
        silent: true,
      })
    );

    const callback = jest.fn();
    const off = transport.onConnect(callback);
    await (transport as any)._handleConnectCallbacks();
    expect(callback).toHaveBeenCalledTimes(1);
    const immediate = jest.fn();
    transport.onConnect(immediate);
    expect(immediate).toHaveBeenCalled();

    if (typeof off === 'function') {
      off();
    }
    await (transport as any)._handleConnectCallbacks();

    (transport as any)[senderKey]({
      type: 'response',
      transfer: ['buffer'],
    });
    const [message, transferList] = postMessageMock.mock.calls.slice(-1)[0];
    expect(message).not.toHaveProperty('transfer');
    expect(transferList).toEqual(['buffer']);

    transport.dispose();
    expect(selfMock.removeEventListener).toHaveBeenCalledWith(
      'message',
      messageHandler
    );
  });
});
