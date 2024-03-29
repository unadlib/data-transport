import { Transport, createTransport, mockPorts } from '../src';

test('dispose in base transport', async () => {
  type Internal = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  const ports = mockPorts();

  const internal: Transport<{ emit: Internal }> = createTransport(
    'Base',
    ports.main
  );
  const external: Transport<{ listen: Internal }> = createTransport(
    'Base',
    ports.create()
  );
  external.listen('hello', async (options, word) => ({
    text: `hello ${options.num} ${word}`,
  }));
  expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello 42 Universe',
  });

  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  external.dispose();

  const result = await internal.emit(
    { name: 'hello', timeout: 1001 },
    { num: 42 },
    'Universe'
  );
  expect(result).toBeUndefined();
  expect(warn.mock.calls[0][0]).toBe(
    "The event 'DataTransport-hello' timed out for 1001 seconds..."
  );
  expect(warn.mock.calls.length).toBe(1);


  const result1 = await internal.emit(
    { name: 'hello', timeout: 1002, silent: true },
    { num: 42 },
    'Universe'
  );
  expect(result1).toBeUndefined();
  expect(warn.mock.calls.length).toBe(1);
});
