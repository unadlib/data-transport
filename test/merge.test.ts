import {
  Transport,
  createTransport,
  mockPorts,
  merge,
  MergeInteraction,
} from '../src';

test('base merge transport by main', async () => {
  type Internal0 = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  type Internal1 = {
    hi(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  type External = {
    hello(options: { num: number }, word: string): Promise<{ text: string }>;
  };

  const fn0 = jest.fn();
  fn0.mockImplementation((data) => data);

  const fn1 = jest.fn();
  fn1.mockImplementation((data) => data);

  const ports0 = mockPorts();
  const internal0: Transport<{ emit: Internal0 }> = createTransport(
    'Base',
    ports0.main
  );
  type External0Interaction = {
    emit: External;
    listen: Internal0;
  };
  const external0: Transport<External0Interaction> = createTransport(
    'Base',
    ports0.create()
  );

  const ports1 = mockPorts();
  const internal1: Transport<{ emit: Internal1 }> = createTransport(
    'Base',
    ports1.main
  );
  const external1: Transport<{
    emit: External;
    listen: Internal1;
  }> = createTransport('Base', ports1.create());

  external0.listen('hello', async (options, word) =>
    fn0({
      text: `hello0, ${options.num} ${word}`,
    })
  );

  external1.listen('hi', async (options, word) =>
    fn1({
      text: `hi1, ${options.num} ${word}`,
    })
  );

  const internal: Transport<
    MergeInteraction<
      External0Interaction,
      {
        emit: Internal1;
      }
    >
  > = merge(internal0, internal1);

  internal.listen('hello', async (options, word) => ({
    text: `hello, ${options.num} ${word}`,
  }));

  expect(fn0).toHaveBeenCalledTimes(0);
  expect(fn1).toHaveBeenCalledTimes(0);

  expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello0, 42 Universe',
  });

  expect(fn0).toHaveBeenCalledTimes(1);
  expect(fn1).toHaveBeenCalledTimes(0);

  expect(await internal.emit('hi', { num: 42 }, 'Universe')).toEqual({
    text: 'hi1, 42 Universe',
  });

  expect(fn0).toHaveBeenCalledTimes(1);
  expect(fn1).toHaveBeenCalledTimes(1);

  expect(await external1.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello, 42 Universe',
  });

  expect(await external1.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello, 42 Universe',
  });

  expect(await external0.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello, 42 Universe',
  });

  internal.dispose();

  await expect(
    Promise.race([
      external0.emit('hello', { num: 42 }, 'Universe'),
      new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 100);
      }),
    ])
  ).resolves.toBe('timeout');
});

test('base merge transport error', async () => {
  expect(() => {
    // @ts-expect-error
    merge();
  }).toThrow();
  expect(() => {
    const ports0 = mockPorts();
    const internal0 = createTransport('Base', ports0.main);
    // @ts-expect-error
    merge(internal0);
  }).toThrow();
});
