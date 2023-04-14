import { Transport, createTransport, mockPorts } from '../src';

test('prefix in base transport', async () => {
  type Internal = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  const ports = mockPorts();

  const internal: Transport<{ emit: Internal }> = createTransport('Base', {
    ...ports.main,
    prefix: 'internal',
  });
  const external: Transport<{ listen: Internal }> = createTransport('Base', {
    ...ports.create(),
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
