import { BroadcastTransport } from '../src/transports/broadcastTransport';
import { listen } from '../src/decorators';

// Mock BroadcastChannel
class MockBroadcastChannel {
  private handlers: Map<string, Set<any>> = new Map();
  private static channels: Map<string, MockBroadcastChannel[]> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, []);
    }
    MockBroadcastChannel.channels.get(name)!.push(this);
  }

  addEventListener(event: string, handler: any) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  removeEventListener(event: string, handler: any) {
    this.handlers.get(event)?.delete(handler);
  }

  postMessage(data: any) {
    const channels = MockBroadcastChannel.channels.get(this.name) || [];
    channels.forEach((channel) => {
      if (channel !== this) {
        const handlers = channel.handlers.get('message') || new Set();
        handlers.forEach((handler) => {
          handler({ data });
        });
      }
    });
  }

  close() {
    const channels = MockBroadcastChannel.channels.get(this.name);
    if (channels) {
      const index = channels.indexOf(this);
      if (index > -1) {
        channels.splice(index, 1);
      }
    }
  }
}

(global as any).BroadcastChannel = MockBroadcastChannel;

describe('BroadcastTransport', () => {
  afterEach(() => {
    // Clean up channels after each test
    (MockBroadcastChannel as any).channels.clear();
  });

  test('basic broadcast communication', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    class SenderTransport extends BroadcastTransport<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return await this.emit('hello', options);
      }
    }

    class ReceiverTransport extends BroadcastTransport implements Internal {
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

  test('broadcast with custom channel name', async () => {
    type Internal = {
      test(): Promise<string>;
    };

    class SenderTransport extends BroadcastTransport<{ emit: Internal }> {
      async test() {
        return await this.emit('test');
      }
    }

    class ReceiverTransport extends BroadcastTransport implements Internal {
      @listen
      async test() {
        return 'test result';
      }
    }

    const sender = new SenderTransport({ channel: 'custom-channel' });
    const receiver = new ReceiverTransport({ channel: 'custom-channel' });

    const result = await sender.test();
    expect(result).toBe('test result');
  });

  test('broadcast with custom BroadcastChannel instance', async () => {
    type Internal = {
      greet(name: string): Promise<string>;
    };

    const customChannel = new MockBroadcastChannel('shared-channel');

    class SenderTransport extends BroadcastTransport<{ emit: Internal }> {
      async greet(name: string) {
        return await this.emit('greet', name);
      }
    }

    class ReceiverTransport extends BroadcastTransport implements Internal {
      @listen
      async greet(name: string) {
        return `Hello, ${name}!`;
      }
    }

    const sender = new SenderTransport({
      broadcastChannel: customChannel as any,
    });
    const receiver = new ReceiverTransport({
      channel: 'shared-channel',
    });

    const result = await sender.greet('World');
    expect(result).toBe('Hello, World!');
  });

  test('multiple receivers on same channel', async () => {
    type Internal = {
      broadcast(msg: string): Promise<string>;
    };

    class SenderTransport extends BroadcastTransport<{ emit: Internal }> {
      async broadcast(msg: string) {
        return await this.emit('broadcast', msg);
      }
    }

    class ReceiverTransport extends BroadcastTransport implements Internal {
      private receiverId: string;

      constructor(id: string) {
        super({ channel: 'multi-channel' });
        this.receiverId = id;
      }

      @listen
      async broadcast(msg: string) {
        return `${this.receiverId}: ${msg}`;
      }
    }

    const sender = new SenderTransport({ channel: 'multi-channel' });
    const receiver1 = new ReceiverTransport('receiver1');
    const receiver2 = new ReceiverTransport('receiver2');

    // Only one receiver will respond (the first one to handle the message)
    const result = await sender.broadcast('test message');
    expect(result).toMatch(/receiver[12]: test message/);
  });

});
