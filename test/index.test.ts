import { Transport, listen, Receiver, Listen, TransportData } from '../src';

test('base', async () => {
  type Internal = {
    hello: TransportData<{ num: number }, { text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
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

    async sayHello() {
      const response = await this.emit('hello', { num: 42 });
      return response;
    }
  }

  class ExternalTransport extends Transport implements Receiver<Internal> {
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
    hello({ request, respond }: Listen<Internal['hello']>) {
      request.num;
      respond({
        text: `hello ${request.num}`,
      });
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
});

test('base with `{ hasRespond: false }`', async () => {
  type Internal = {
    hello: TransportData<{ num: number }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
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

    async sayHello() {
      const response = await this.emit(
        'hello',
        { num: 42 },
        { respond: false, timeout: 42 }
      );
      return response;
    }
  }

  class ExternalTransport extends Transport implements Receiver<Internal> {
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
    hello({ request }: Listen<Internal['hello']>) {
      expect(request.num).toBe(42);
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toBeUndefined();
});

test('base with two-way', async () => {
  type Internal = {
    hello: TransportData<{ num: number }, { text: string }>;
  };

  type External = {
    help: TransportData<{ key: number }, { text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport
    extends Transport<Internal>
    implements Receiver<External> {
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
    help({ request, respond }: Listen<External['help']>) {
      respond({
        text: String.fromCharCode(request.key),
      });
    }

    async sayHello() {
      const response = await this.emit('hello', { num: 42 });
      return response;
    }
  }

  class ExternalTransport
    extends Transport<External>
    implements Receiver<Internal> {
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

    help() {
      return this.emit('help', { key: 65 });
    }

    @listen
    hello({ request, respond }: Listen<Internal['hello']>) {
      respond({
        text: `hello ${request.num}`,
      });
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
  expect(await external.help()).toEqual({ text: 'A' });
  expect(() => {
    external.hello({
      request: { num: 1 },
      respond: () => {},
    });
  }).toThrowError(
    "The method 'hello' is a listen function that can NOT be actively called."
  );
  expect(() => {
    internal.help({
      request: { key: 1 },
      respond: () => {},
    });
  }).toThrowError(
    "The method 'help' is a listen function that can NOT be actively called."
  );
});

test('base with non-decorator', async () => {
  type Internal = {
    hello: TransportData<{ num: number }, { text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
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

    async sayHello() {
      const response = await this.emit('hello', { num: 42 });
      return response;
    }
  }

  class ExternalTransport extends Transport implements Receiver<Internal> {
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

    hello({ request, respond }: Listen<Internal['hello']>) {
      request.num;
      respond({
        text: `hello ${request.num}`,
      });
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
});

test('base with `undefined`', async () => {
  type Internal = {
    hello: TransportData<void>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
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

    async sayHello() {
      const response = await this.emit('hello', undefined);
      return response;
    }
  }

  class ExternalTransport extends Transport implements Receiver<Internal> {
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
    hello({ request, respond }: Listen<Internal['hello']>) {
      respond(undefined);
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toBeUndefined();
});
