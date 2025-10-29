import { Transport, mockPorts } from '../src';
import { listen } from '../src/decorators';

describe('listen decorator', () => {
  test('listen decorator marks method as listener', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    const ports = mockPorts();

    class InternalTransport
      extends Transport<{ emit: Internal }>
      implements Internal
    {
      constructor() {
        super(ports.main);
      }

      async hello(options: { num: number }) {
        const response = await this.emit('hello', options);
        return response;
      }
    }

    class ExternalTransport extends Transport implements Internal {
      constructor() {
        super(ports.create());
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

    const result = await internal.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });

    // Verify that calling the decorated method directly throws error
    expect(() => {
      external.hello({ num: 42 });
    }).toThrowError(
      "The method 'hello' is a listen function that can NOT be actively called."
    );
  });

  test('listen decorator with multiple methods', async () => {
    type Internal = {
      method1(): Promise<string>;
      method2(): Promise<number>;
    };

    const ports = mockPorts();

    class InternalTransport
      extends Transport<{ emit: Internal }>
      implements Internal
    {
      constructor() {
        super(ports.main);
      }

      async method1() {
        return await this.emit('method1');
      }

      async method2() {
        return await this.emit('method2');
      }
    }

    class ExternalTransport extends Transport implements Internal {
      constructor() {
        super(ports.create());
      }

      @listen
      async method1() {
        return 'method1 result';
      }

      @listen
      async method2() {
        return 42;
      }
    }

    const internal = new InternalTransport();
    const external = new ExternalTransport();

    const result1 = await internal.method1();
    expect(result1).toBe('method1 result');

    const result2 = await internal.method2();
    expect(result2).toBe(42);

    // Both methods should throw when called directly
    expect(() => {
      external.method1();
    }).toThrowError(
      "The method 'method1' is a listen function that can NOT be actively called."
    );

    expect(() => {
      external.method2();
    }).toThrowError(
      "The method 'method2' is a listen function that can NOT be actively called."
    );
  });

  test('listen decorator preserves method descriptor', async () => {
    const ports = mockPorts();

    class TestTransport extends Transport {
      constructor() {
        super(ports.create());
      }

      @listen
      async testMethod(arg: string) {
        return `received: ${arg}`;
      }
    }

    const transport = new TestTransport();

    // The method should exist
    expect(typeof transport.testMethod).toBe('function');

    // But calling it should throw
    expect(() => {
      transport.testMethod('test');
    }).toThrowError(
      "The method 'testMethod' is a listen function that can NOT be actively called."
    );
  });

  test('listen decorator with complex arguments', async () => {
    type Internal = {
      complexMethod(
        arg1: string,
        arg2: number,
        arg3: { key: string }
      ): Promise<string>;
    };

    const ports = mockPorts();

    class InternalTransport
      extends Transport<{ emit: Internal }>
      implements Internal
    {
      constructor() {
        super(ports.main);
      }

      async complexMethod(arg1: string, arg2: number, arg3: { key: string }) {
        return await this.emit('complexMethod', arg1, arg2, arg3);
      }
    }

    class ExternalTransport extends Transport implements Internal {
      constructor() {
        super(ports.create());
      }

      @listen
      async complexMethod(arg1: string, arg2: number, arg3: { key: string }) {
        return `${arg1}-${arg2}-${arg3.key}`;
      }
    }

    const internal = new InternalTransport();
    const external = new ExternalTransport();

    const result = await internal.complexMethod('test', 42, { key: 'value' });
    expect(result).toBe('test-42-value');
  });
});
