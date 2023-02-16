import { Transport, createTransport, mockPorts } from '../src';

test('base multiple transport', async () => {
  type Internal = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
    hi(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  type External = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  const ports = mockPorts();

  const fn0 = jest.fn();
  fn0.mockImplementation((data) => data);

  const fn1 = jest.fn();
  fn1.mockImplementation((data) => data);

  const internal: Transport<{
    listen: Internal;
    emit: External;
  }> = createTransport('Base', ports.main);
  const external0: Transport<{ emit: Internal }> = createTransport(
    'Base',
    ports.create()
  );
  external0.listen('hello', async (options, word) =>
    fn0({
      text: `hello0, ${options.num} ${word}`,
    })
  );
  const external1: Transport<{
    listen: External;
    emit: Internal;
  }> = createTransport('Base', ports.create());
  external1.listen('hello', async (options, word) =>
    fn1({
      text: `hello1, ${options.num} ${word}`,
    })
  );

  external1.listen('hi', async (options, word) => ({
    text: `hi1, ${options.num} ${word}`,
  }));

  expect(fn0).toBeCalledTimes(0);
  expect(fn1).toBeCalledTimes(0);

  expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello0, 42 Universe',
  });

  expect(fn0).toBeCalledTimes(1);
  expect(fn1).toBeCalledTimes(1);

  expect(await internal.emit('hi', { num: 42 }, 'Universe')).toEqual({
    text: 'hi1, 42 Universe',
  });

  expect(fn0).toBeCalledTimes(1);
  expect(fn1).toBeCalledTimes(1);

  internal.listen('hello', async (options, word) => ({
    text: `hello, ${options.num} ${word}`,
  }));

  expect(await external1.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello, 42 Universe',
  });

  expect(fn0).toBeCalledTimes(1);
  expect(fn1).toBeCalledTimes(1);
});
