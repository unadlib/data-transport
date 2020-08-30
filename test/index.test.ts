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
