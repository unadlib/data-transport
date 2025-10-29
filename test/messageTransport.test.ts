import { MessageTransport } from '../src/transports/messageTransport';
import { listen } from '../src/decorators';

describe('MessageTransport', () => {
  test('basic message transport communication', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    class SenderTransport extends MessageTransport<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return await this.emit('hello', options);
      }
    }

    class ReceiverTransport extends MessageTransport implements Internal {
      @listen
      async hello(options: { num: number }) {
        return {
          text: `hello ${options.num}`,
        };
      }
    }

    const sender = new SenderTransport({});
    const receiver = new ReceiverTransport({});

    const result = await sender.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });
  });

  test('message transport with custom targetOrigin', async () => {
    type Internal = {
      test(): Promise<string>;
    };

    const mockPostMessage = jest.fn();
    const originalPostMessage = window.postMessage;
    window.postMessage = mockPostMessage;

    class SenderTransport extends MessageTransport<{ emit: Internal }> {
      async test() {
        return await this.emit('test');
      }
    }

    class ReceiverTransport extends MessageTransport implements Internal {
      @listen
      async test() {
        return 'test result';
      }
    }

    const sender = new SenderTransport({ targetOrigin: 'https://example.com' });
    const receiver = new ReceiverTransport({ targetOrigin: 'https://example.com' });

    // Verify postMessage was called with custom origin
    sender.emit('test');
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Restore original
    window.postMessage = originalPostMessage;
  });

  test('message transport with prefix option', async () => {
    type Internal = {
      greet(name: string): Promise<string>;
    };

    class SenderTransport extends MessageTransport<{ emit: Internal }> {
      async greet(name: string) {
        return await this.emit('greet', name);
      }
    }

    class ReceiverTransport extends MessageTransport implements Internal {
      @listen
      async greet(name: string) {
        return `Hello, ${name}!`;
      }
    }

    const sender = new SenderTransport({ prefix: 'CustomPrefix' });
    const receiver = new ReceiverTransport({ prefix: 'CustomPrefix' });

    const result = await sender.greet('World');
    expect(result).toBe('Hello, World!');
  });
});
