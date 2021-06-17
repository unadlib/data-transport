import { Transport, createTransport, mockPairPorts } from '../src';

test.only('prefix in base transport', async () => {
  interface Internal {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  }

  const ports = mockPairPorts();

  const internal: Transport<Internal> = createTransport('Base', {
    ...ports[0],
    prefix: 'internal',
  });
  const external: Transport<any, Internal> = createTransport('Base', {
    ...ports[1],
    prefix: 'external',
  });
  external.listen('hello', async (options, word) => ({
    text: `hello ${options.num} ${word}`,
  }));

  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const result = await internal.emit(
    { name: 'hello', timeout: 1002 },
    { num: 42 },
    'Universe'
  );
  expect(result).toBeUndefined();
  expect(warn.mock.calls[0][0]).toBe(
    "The event 'internal-hello' timed out for 1002 seconds..."
  );
});
