import { ProcessTransport } from '../src/transports/processTransport';
import { listen } from '../src/decorators';
import { EventEmitter } from 'events';

describe('ProcessTransport', () => {
  test('main and child process communication', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    // Mock ChildProcess
    const childEmitter = new EventEmitter();
    const mockChild = {
      on: jest.fn((event: string, handler: any) => {
        childEmitter.on(event, handler);
      }),
      off: jest.fn((event: string, handler: any) => {
        childEmitter.off(event, handler);
      }),
      send: jest.fn((data: any) => {
        processEmitter.emit('message', data);
      }),
    };

    // Mock process
    const processEmitter = new EventEmitter();
    const mockProcess = {
      on: jest.fn((event: string, handler: any) => {
        processEmitter.on(event, handler);
      }),
      off: jest.fn((event: string, handler: any) => {
        processEmitter.off(event, handler);
      }),
      send: jest.fn((data: any) => {
        childEmitter.emit('message', data);
      }),
    };

    class MainTransport extends ProcessTransport.Main<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return await this.emit('hello', options);
      }
    }

    class ChildTransport extends ProcessTransport.Child implements Internal {
      @listen
      async hello(options: { num: number }) {
        return {
          text: `hello ${options.num}`,
        };
      }
    }

    const main = new MainTransport({
      child: mockChild as any,
    });

    // Mock global process for child
    (global as any).process = mockProcess;

    const child = new ChildTransport({});

    const result = await main.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });
    expect(mockChild.send).toHaveBeenCalled();
    expect(mockProcess.send).toHaveBeenCalled();
  });

  test('child process with custom options', async () => {
    const processEmitter = new EventEmitter();
    const mockProcess = {
      on: jest.fn((event: string, handler: any) => {
        processEmitter.on(event, handler);
      }),
      off: jest.fn((event: string, handler: any) => {
        processEmitter.off(event, handler);
      }),
      send: jest.fn(),
    };

    (global as any).process = mockProcess;

    class ChildTransport extends ProcessTransport.Child {
      async test() {
        return await this.emit('test');
      }
    }

    const child = new ChildTransport({
      prefix: 'CustomPrefix',
      timeout: 5000,
    });

    expect(mockProcess.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('main process dispose', async () => {
    const childEmitter = new EventEmitter();
    const mockChild = {
      on: jest.fn((event: string, handler: any) => {
        childEmitter.on(event, handler);
      }),
      off: jest.fn((event: string, handler: any) => {
        childEmitter.off(event, handler);
      }),
      send: jest.fn(),
    };

    class MainTransport extends ProcessTransport.Main {}

    const main = new MainTransport({
      child: mockChild as any,
    });

    main.dispose();
    expect(mockChild.off).toHaveBeenCalled();
  });
});
