import {
  ServiceWorkerClientTransport,
  ServiceWorkerServiceTransport,
} from '../src/transports/serviceWorkerTransport';
import { transportKey, transportType, senderKey } from '../src/constant';
import * as utils from '../src/utils';

describe('ServiceWorkerTransport', () => {
  const originalServiceWorker = (navigator as any).serviceWorker;
  const originalSelf = (globalThis as any).self;

  afterEach(() => {
    jest.restoreAllMocks();
    if (typeof originalServiceWorker === 'undefined') {
      delete (navigator as any).serviceWorker;
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    }
    if (typeof originalSelf === 'undefined') {
      delete (globalThis as any).self;
    } else {
      Object.defineProperty(globalThis, 'self', {
        value: originalSelf,
        configurable: true,
      });
    }
  });

  test('client transport decodes Safari payloads and posts responses', async () => {
    let navigatorMessageHandler: any;
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        addEventListener: (_: string, handler: any) => {
          navigatorMessageHandler = handler;
        },
        removeEventListener: jest.fn(),
      },
      configurable: true,
    });

    const worker = {
      postMessage: jest.fn(),
    };

    jest.spyOn(utils, 'detectSafari').mockReturnValue(true);

    class ClientTransport extends ServiceWorkerClientTransport {}
    const transport = new ClientTransport({
      worker: worker as any,
      useOnSafari: true,
    });

    transport.listen('ping', async (request: { value: number }) => {
      expect(request.value).toBe(1);
      return 'ack';
    });

    const requestPayload = {
      type: transportType.request,
      action: 'DataTransport-ping',
      hasRespond: true,
      request: [{ value: 1 }],
      [transportKey]: 'uuid',
      requestId: 'req',
    };

    navigatorMessageHandler({ data: JSON.stringify(requestPayload) });
    await Promise.resolve();

    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: transportType.response,
        response: 'ack',
      }),
      []
    );
  });

  test('service transport routes responses to correct clients', async () => {
    let messageHandler: any;
    let activateHandler: any;
    const clientPostMessage = jest.fn();
    const broadcastClients = [{ postMessage: jest.fn() }, { postMessage: jest.fn() }];
    const clients = {
      get: jest.fn().mockResolvedValue({ postMessage: clientPostMessage }),
      matchAll: jest.fn().mockResolvedValue(broadcastClients),
      claim: jest.fn().mockResolvedValue(undefined),
    };

    const addEventListenerMock = jest.fn((type: string, handler: any) => {
      if (type === 'message') {
        messageHandler = handler;
      } else if (type === 'activate') {
        activateHandler = handler;
      }
    });

    const globalScope = {
      addEventListener: addEventListenerMock,
      removeEventListener: jest.fn(),
      clients,
    };

    Object.defineProperty(globalThis, 'self', {
      value: globalScope,
      configurable: true,
    });
    jest.spyOn(utils, 'detectSafari').mockReturnValue(true);

    class ServiceTransport extends ServiceWorkerServiceTransport {}
    const transport = new ServiceTransport({ useOnSafari: true });
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );

    const data = {
      type: transportType.request,
      action: 'DataTransport-ping',
      hasRespond: false,
      [transportKey]: 'transport-id',
      requestId: 'req-1',
    };

    messageHandler({ data, source: { id: 'client-42' } });
    expect((data as any)._clientId).toBe('client-42');

    const waitUntil = jest.fn();
    activateHandler({ waitUntil });
    expect(waitUntil).toHaveBeenCalled();
    expect(clients.claim).toHaveBeenCalled();

    await (transport as any)[senderKey]({
      type: transportType.response,
      _clientId: 'client-99',
      payload: 'data',
      transfer: ['port'],
    });
    expect(clients.get).toHaveBeenCalledWith('client-99');
    expect(clientPostMessage).toHaveBeenCalledWith(
      expect.any(String),
      ['port']
    );

    const extraClient = { postMessage: jest.fn() };
    await (transport as any)[senderKey]({
      type: transportType.response,
      _extra: { _client: extraClient },
    });
    expect(extraClient.postMessage).toHaveBeenCalled();

    await (transport as any)[senderKey]({
      type: transportType.request,
      message: 'broadcast',
    });
    expect(clients.matchAll).toHaveBeenCalled();
    await clients.matchAll.mock.results[0].value;
    for (const client of broadcastClients) {
      expect(client.postMessage).toHaveBeenCalled();
    }
  });
});
