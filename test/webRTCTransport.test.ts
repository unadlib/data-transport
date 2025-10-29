import {
  prefixKey,
  senderKey,
  transportType,
} from '../src/constant';
import { getAction } from '../src/transport';
import { WebRTCTransport } from '../src/transports/webRTCTransport';

const createPeer = () => {
  const sendMock = jest.fn();
  const channel = {
    bufferedAmount: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  const peer = {
    on: jest.fn(),
    off: jest.fn(),
    send: sendMock,
    _channel: channel,
  };

  return { peer, sendMock, channel };
};

describe('WebRTCTransport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reassembles chunked data and clears stale buffers', async () => {
    const { peer, sendMock } = createPeer();

    class TestTransport extends WebRTCTransport {}
    const transport = new TestTransport({ peer } as any);

    const dataHandler = peer.on.mock.calls.find(
      ([event]) => event === 'data'
    )?.[1] as (data: string) => void;

    expect(typeof dataHandler).toBe('function');

    const action = getAction(
      (transport as any)[prefixKey],
      'test'
    );
    const listener = jest.fn().mockResolvedValue('ok');
    transport.listen('test', listener);

    const payloadBody = 'x'.repeat(70_000);
    const payload = JSON.stringify([{ value: payloadBody }]);
    const chunkSize = 1024 * 60;
    const firstChunk = payload.slice(0, chunkSize);
    const secondChunk = payload.slice(chunkSize);
    const uuid = 'uuid-test';

    (transport as any).receiveBuffer.set('stale', {
      data: ['z'],
      timestamp: Date.now() - 61_000,
    });

    dataHandler(
      JSON.stringify({
        __DATA_TRANSPORT_UUID__: uuid,
        type: transportType.request,
        action,
        hasRespond: true,
        requestId: 'req-1',
        chunkId: 0,
        length: 2,
        request: firstChunk,
      })
    );

    expect((transport as any).receiveBuffer.get(uuid).data[0]).toBe(
      firstChunk
    );

    dataHandler(
      JSON.stringify({
        __DATA_TRANSPORT_UUID__: uuid,
        type: transportType.request,
        action,
        hasRespond: true,
        requestId: 'req-1',
        chunkId: 1,
        length: 2,
        request: secondChunk,
      })
    );

    await Promise.resolve();
    expect(listener).toHaveBeenCalledWith({ value: payloadBody });
    expect((transport as any).receiveBuffer.has(uuid)).toBe(false);
    expect((transport as any).receiveBuffer.has('stale')).toBe(false);
    expect(sendMock).toHaveBeenCalled();
  });

  test('sender chunks payloads and resumes after buffered amount drops', () => {
    const { peer, sendMock, channel } = createPeer();

    class TestTransport extends WebRTCTransport {}
    const transport = new TestTransport({ peer } as any);

    const sender = (transport as any)[senderKey].bind(transport);

    const largePayload = 'y'.repeat(130_000);
    sender({
      __DATA_TRANSPORT_UUID__: 'uuid-large',
      type: transportType.request,
      action: getAction((transport as any)[prefixKey], 'notify'),
      request: [largePayload],
    });

    expect(sendMock).toHaveBeenCalled();
    expect(sendMock.mock.calls.length).toBeGreaterThan(1);
    const firstSend = JSON.parse(sendMock.mock.calls[0][0]);
    expect(firstSend.chunkId).toBe(0);

    sendMock.mockClear();
    channel.bufferedAmount = 70_000;

    sender({
      __DATA_TRANSPORT_UUID__: 'uuid-queue',
      type: transportType.request,
      action: getAction((transport as any)[prefixKey], 'ping'),
      request: ['queued'],
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(channel.addEventListener).toHaveBeenCalledWith(
      'bufferedamountlow',
      expect.any(Function)
    );
    const listener = channel.addEventListener.mock.calls[
      channel.addEventListener.mock.calls.length - 1
    ][1] as () => void;

    channel.bufferedAmount = 0;
    listener();
    expect(sendMock).toHaveBeenCalled();
    expect(channel.removeEventListener).toHaveBeenCalledWith(
      'bufferedamountlow',
      listener
    );

    sendMock.mockReset().mockImplementation(() => {
      throw new Error('send fail');
    });
    channel.bufferedAmount = 70_000;

    sender({
      __DATA_TRANSPORT_UUID__: 'uuid-error',
      type: transportType.response,
      response: 'payload',
      action: getAction((transport as any)[prefixKey], 'response'),
    });

    const errorListener = channel.addEventListener.mock.calls[
      channel.addEventListener.mock.calls.length - 1
    ][1] as () => void;
    channel.bufferedAmount = 0;
    expect(() => errorListener()).toThrow(
      'Error send message to peer: send fail'
    );
  });
});
