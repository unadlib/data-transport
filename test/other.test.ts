import { Transport, listen, createTransport, mockPorts } from '../src';

test('enable verbose', async () => {
  type Internal = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  const infoLog = jest.spyOn(console, 'info').mockImplementation(() => {});

  const ports = mockPorts();

  const internal: Transport<{ emit: Internal }> = createTransport('Base', {
    ...ports.main,
    verbose: true,
  });
  const external: Transport<{ listen: Internal }> = createTransport('Base', {
    ...ports.create(),
    verbose: true,
  });
  const dispose = external.listen('hello', async (options, word) => ({
    text: `hello ${options.num} ${word}`,
  }));
  expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello 42 Universe',
  });

  expect(() => {
    // @ts-expect-error
    external.listen('hello', () => {});
  }).toThrowErrorMatchingInlineSnapshot(
    `"Failed to listen to the event "hello", the event "hello" is already listened to."`
  );

  const warnLog = jest.spyOn(console, 'warn').mockImplementation(() => {});

  dispose?.();

  const result = await internal.emit(
    { name: 'hello', timeout: 1000 },
    { num: 42 },
    'Universe'
  );
  expect(result).toBeUndefined();
  expect(warnLog.mock.calls[0][0]).toBe(
    "The event 'DataTransport-hello' timed out for 1000 seconds..."
  );

  expect(
    infoLog.mock.calls.map((item: any[]) => {
      item[1].__DATA_TRANSPORT_UUID__ = '__DATA_TRANSPORT_UUID__';
      if (item[1].requestId) {
        item[1].requestId = 'requestId';
      }
      if (item[1].responseId) {
        item[1].responseId = 'responseId';
      }

      return item;
    })
  ).toMatchInlineSnapshot(`
    [
      [
        "DataTransport Send: ",
        {
          "__DATA_TRANSPORT_UUID__": "__DATA_TRANSPORT_UUID__",
          "action": "DataTransport-hello",
          "hasRespond": true,
          "request": [
            {
              "num": 42,
            },
            "Universe",
          ],
          "requestId": "requestId",
          "type": "request",
        },
      ],
      [
        "DataTransport Receive: ",
        {
          "__DATA_TRANSPORT_UUID__": "__DATA_TRANSPORT_UUID__",
          "action": "DataTransport-hello",
          "hasRespond": true,
          "request": [
            {
              "num": 42,
            },
            "Universe",
          ],
          "requestId": "requestId",
          "type": "request",
        },
      ],
      [
        "DataTransport Receive: ",
        {
          "__DATA_TRANSPORT_UUID__": "__DATA_TRANSPORT_UUID__",
          "action": "DataTransport-hello",
          "hasRespond": true,
          "requestId": "requestId",
          "response": {
            "text": "hello 42 Universe",
          },
          "responseId": "responseId",
          "type": "response",
        },
      ],
      [
        "DataTransport Send: ",
        {
          "__DATA_TRANSPORT_UUID__": "__DATA_TRANSPORT_UUID__",
          "action": "DataTransport-hello",
          "hasRespond": true,
          "request": [
            {
              "num": 42,
            },
            "Universe",
          ],
          "requestId": "requestId",
          "type": "request",
        },
      ],
      [
        "DataTransport Receive: ",
        {
          "__DATA_TRANSPORT_UUID__": "__DATA_TRANSPORT_UUID__",
          "action": "DataTransport-hello",
          "hasRespond": true,
          "request": [
            {
              "num": 42,
            },
            "Universe",
          ],
          "requestId": "requestId",
          "type": "request",
        },
      ],
    ]
  `);

  warnLog.mockRestore();
});
