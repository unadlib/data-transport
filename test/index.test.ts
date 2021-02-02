import { Transport, listen, createTransport } from '../src';

test('base', async () => {
  interface Internal {
    hello(options: { num: number }, x: string): Promise<{ text: string }>;
  }

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockExternalSend = callback;
        },
        sender: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    async hello(options: { num: number }, word: string) {
      const response = await this.emit('hello', options, word);
      return response;
    }
  }

  class ExternalTransport extends Transport implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockInternalSend = callback;
        },
        sender: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @listen
    async hello(options: { num: number }, word: string) {
      return {
        text: `hello ${options.num} ${word}`,
      };
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.hello({ num: 42 }, 'Universe')).toEqual({
    text: 'hello 42 Universe',
  });
});

test('base with `{ hasRespond: false }`', async () => {
  interface Internal {
    hello(options: { num: number }): Promise<void>;
  }

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockExternalSend = callback;
        },
        sender: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    async hello(options: { num: number }) {
      const response = await this.send(
        { name: 'hello', respond: false, timeout: 42 },
        options
      );
      return response;
    }
  }

  class ExternalTransport extends Transport implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockInternalSend = callback;
        },
        sender: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @listen
    async hello(options: { num: number }) {
      expect(options.num).toBe(42);
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.hello({ num: 42 })).toBeUndefined();
});

test('base with two-way', async () => {
  interface Internal {
    hello(options: { num: number }): Promise<{ text: string }>;
  }

  interface External {
    help(options: { key: number }): Promise<{ text: string }>;
  }

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport
    extends Transport<Internal>
    implements External, Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockExternalSend = callback;
        },
        sender: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @listen
    async help(options: { key: number }) {
      return {
        text: String.fromCharCode(options.key),
      };
    }

    async hello(options: { num: number }) {
      const response = await this.emit('hello', options);
      return response;
    }
  }

  class ExternalTransport
    extends Transport<External>
    implements External, Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockInternalSend = callback;
        },
        sender: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    async help(options: { key: number }) {
      return await this.emit('help', options);
    }

    @listen
    async hello(options: { num: number }) {
      return {
        text: `hello ${options.num}`,
      };
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.hello({ num: 42 })).toEqual({ text: 'hello 42' });
  expect(await external.help({ key: 65 })).toEqual({ text: 'A' });
  expect(() => {
    external.hello({ num: 42 });
  }).toThrowError(
    "The method 'hello' is a listen function that can NOT be actively called."
  );
  expect(() => {
    internal.help({ key: 1 });
  }).toThrowError(
    "The method 'help' is a listen function that can NOT be actively called."
  );
});

test('base with non-decorator', async () => {
  type Internal = {
    hello(options: { num: number }): Promise<{ text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockExternalSend = callback;
        },
        sender: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    async hello(options: { num: number }) {
      const response = await this.emit('hello', options);
      return response;
    }
  }

  class ExternalTransport extends Transport implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockInternalSend = callback;
        },
        sender: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
        listenKeys: ['hello'],
      });
    }

    async hello(options: { num: number }) {
      return {
        text: `hello ${options.num}`,
      };
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.hello({ num: 42 })).toEqual({ text: 'hello 42' });
});

test('base with `undefined`', async () => {
  type Internal = {
    hello(): Promise<void>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockExternalSend = callback;
        },
        sender: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    async hello() {
      const response = await this.emit('hello');
      return response;
    }
  }

  class ExternalTransport extends Transport implements Internal {
    constructor() {
      super({
        listener: (callback) => {
          mockInternalSend = callback;
        },
        sender: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @listen
    async hello() {
      //
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.hello()).toBeUndefined();
});

test('base with createTransport', async () => {
  interface Internal {
    hello(options: { num: number }, k: string): Promise<{ text: string }>;
  }

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  const internal: Transport<Internal> = createTransport('Base', {
    listener: (callback) => {
      mockExternalSend = callback;
    },
    sender: (message) => {
      mockInternalSend(JSON.parse(JSON.stringify(message)));
    },
  });
  const external: Transport<any, Internal> = createTransport('Base', {
    listener: (callback) => {
      mockInternalSend = callback;
    },
    sender: (message) => {
      mockExternalSend(JSON.parse(JSON.stringify(message)));
    },
  });
  external.listen('hello', async (options, word) => ({
    text: `hello ${options.num} ${word}`,
  }));
  expect(await internal.emit('hello', { num: 42 }, 'Universe')).toEqual({
    text: 'hello 42 Universe',
  });
});
