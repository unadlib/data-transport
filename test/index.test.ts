import {
  Receiver,
  Transport,
  respond,
  TransportData,
  Request,
  CallBack,
} from '../src';

test('base', async () => {
  type Internal = {
    hello(): TransportData<{ num: number }, { text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
    constructor() {
      super({
        listen: (callback) => {
          mockExternalSend = callback;
        },
        send: (message) => {
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
        listen: (callback) => {
          mockInternalSend = callback;
        },
        send: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @respond
    hello(
      request: Request<Internal['hello']>,
      callback: CallBack<Internal['hello']>
    ) {
      callback({
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
    hello(): TransportData<{ num: number }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport extends Transport<Internal> {
    constructor() {
      super({
        listen: (callback) => {
          mockExternalSend = callback;
        },
        send: (message) => {
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
        listen: (callback) => {
          mockInternalSend = callback;
        },
        send: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @respond
    hello(request: Request<Internal['hello']>) {
      expect(request.num).toBe(42);
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toBeUndefined();
});

test('base with two-way', async () => {
  type Internal = {
    hello(): TransportData<{ num: number }, { text: string }>;
  };

  type External = {
    help(): TransportData<{ key: number }, { text: string }>;
  };

  let mockExternalSend: (...args: any) => void;
  let mockInternalSend: (...args: any) => void;

  class InternalTransport
    extends Transport<Internal>
    implements Receiver<External> {
    constructor() {
      super({
        listen: (callback) => {
          mockExternalSend = callback;
        },
        send: (message) => {
          mockInternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    @respond
    help(
      request: Request<External['help']>,
      callback: CallBack<External['help']>
    ) {
      callback({
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
        listen: (callback) => {
          mockInternalSend = callback;
        },
        send: (message) => {
          mockExternalSend(JSON.parse(JSON.stringify(message)));
        },
      });
    }

    help() {
      return this.emit('help', { key: 65 });
    }

    @respond
    hello(
      request: Request<Internal['hello']>,
      callback: CallBack<Internal['hello']>
    ) {
      callback({
        text: `hello ${request.num}`,
      });
    }
  }

  const internal = new InternalTransport();
  const external = new ExternalTransport();
  expect(await internal.sayHello()).toEqual({ text: 'hello 42' });
  expect(await external.help()).toEqual({ text: 'A' });
  expect(() => {
    external.hello({ num: 1 }, () => {});
  }).toThrowError(
    "The method 'hello' is a listener function that can NOT be actively called."
  );
  expect(() => {
    internal.help({ key: 1 }, () => {});
  }).toThrowError(
    "The method 'help' is a listener function that can NOT be actively called."
  );
});
