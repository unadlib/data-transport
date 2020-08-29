import { Receiver, Transport, respond, TransportData } from '..';

test('', () => {
  type Internal = {
    hello: TransportData<{ num: number }, { str: string }>;
  };

  class InternalTransport extends Transport<Internal> {
    async a(s: string) {
      const a = await this.emit('hello', { num: 1 });
    }
  }

  class ExternalTransport
    extends Transport<Internal>
    implements Receiver<Internal> {
    @respond
    hello(option: { num: number }) {
      this.respond('hello', {
        str: '1',
      });
    }
  }
});
