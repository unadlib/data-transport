import { IFrameTransport } from '../src/transports/iframeTransport';
import { listen } from '../src/decorators';

describe('IFrameTransport', () => {
  test('iframe main and internal communication', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    // Mock iframe
    const mockIframe = {
      contentWindow: {
        postMessage: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock window.parent
    const originalParent = window.parent;
    (window as any).parent = {
      postMessage: jest.fn(),
    };

    let mainMessageHandler: any;
    let iframeMessageHandler: any;

    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'message') {
        if (!mainMessageHandler) {
          mainMessageHandler = handler;
        } else {
          iframeMessageHandler = handler;
        }
      }
      originalAddEventListener.call(window, event as any, handler);
    }) as any;

    window.removeEventListener = jest.fn(
      originalRemoveEventListener
    ) as any;

    // Override iframe's postMessage to trigger message event
    mockIframe.contentWindow.postMessage = jest.fn((message: any) => {
      if (iframeMessageHandler) {
        iframeMessageHandler({
          data: message,
          source: mockIframe.contentWindow,
        });
      }
    });

    // Override parent's postMessage
    (window.parent as any).postMessage = jest.fn((message: any) => {
      if (mainMessageHandler) {
        mainMessageHandler({
          data: message,
          source: mockIframe.contentWindow,
        });
      }
    });

    class MainTransport extends IFrameTransport.Main<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return await this.emit('hello', options);
      }
    }

    class InternalTransport extends IFrameTransport.IFrame implements Internal {
      @listen
      async hello(options: { num: number }) {
        return {
          text: `hello ${options.num}`,
        };
      }
    }

    const main = new MainTransport({
      iframe: mockIframe as any,
      skipConnectionCheck: true,
    });

    const internal = new InternalTransport({
      skipConnectionCheck: true,
    });

    const result = await main.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });

    // Cleanup
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    (window as any).parent = originalParent;
  });

  test('iframe with custom targetOrigin', async () => {
    const mockIframe = {
      contentWindow: {
        postMessage: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    class MainTransport extends IFrameTransport.Main {
      async test() {
        return await this.emit('test');
      }
    }

    const main = new MainTransport({
      iframe: mockIframe as any,
      targetOrigin: 'https://example.com',
      skipConnectionCheck: true,
    });

    main.emit('test');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockIframe.contentWindow.postMessage).toHaveBeenCalled();
  });

});
