import { Receiver, Transport, respond, TransportData } from '../src';

test('', () => {
  type Internal = {
    hello: TransportData<{ num: number }, { str: string }>;
  };

  class InternalTransport extends Transport<Internal> {
    constructor() {
      super({
        listen: (callback, options) => {
          // window.addEventListener('message', callback, options);
        },
        send: (message, options) => {},
      });
    }

    async a(s: string) {
      const a = await this.emit('hello', { num: 1 });
    }
  }

  class ExternalTransport
    extends Transport<any, Internal>
    implements Receiver<Internal> {
    @respond
    hello(option: { num: number }) {
      this.respond('hello', {
        str: '1',
      });
    }
  }
});
