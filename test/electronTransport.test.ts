import { ElectronTransport } from '../src/transports/electronTransport';
import { listen } from '../src/decorators';
import { EventEmitter } from 'events';

describe('ElectronTransport', () => {
  test('main and renderer process communication', async () => {
    type Internal = {
      hello(options: { num: number }): Promise<{ text: string }>;
    };

    // Mock IpcMain
    const ipcMainEmitter = new EventEmitter();
    const mockIpcMain = {
      on: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.off(channel, handler);
      }),
    };

    // Mock IpcRenderer
    const ipcRendererEmitter = new EventEmitter();
    const mockIpcRenderer = {
      on: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.off(channel, handler);
      }),
      send: jest.fn((channel: string, data: any) => {
        ipcMainEmitter.emit(channel, {}, data);
      }),
    };

    // Mock BrowserWindow
    const mockBrowserWindow = {
      webContents: {
        send: jest.fn((channel: string, data: any) => {
          ipcRendererEmitter.emit(channel, {}, data);
        }),
      },
    };

    class MainTransport extends ElectronTransport.Main<{ emit: Internal }> {
      async hello(options: { num: number }) {
        return await this.emit('hello', options);
      }
    }

    class RendererTransport
      extends ElectronTransport.Renderer
      implements Internal
    {
      @listen
      async hello(options: { num: number }) {
        return {
          text: `hello ${options.num}`,
        };
      }
    }

    const main = new MainTransport({
      ipcMain: mockIpcMain as any,
      browserWindow: mockBrowserWindow as any,
    });

    const renderer = new RendererTransport({
      ipcRenderer: mockIpcRenderer as any,
    });

    const result = await main.hello({ num: 42 });
    expect(result).toEqual({ text: 'hello 42' });
    expect(mockBrowserWindow.webContents.send).toHaveBeenCalled();
    expect(mockIpcRenderer.send).toHaveBeenCalled();
  });

  test('electron with custom channel', async () => {
    type Internal = {
      test(): Promise<string>;
    };

    const ipcMainEmitter = new EventEmitter();
    const mockIpcMain = {
      on: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.off(channel, handler);
      }),
    };

    const ipcRendererEmitter = new EventEmitter();
    const mockIpcRenderer = {
      on: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.off(channel, handler);
      }),
      send: jest.fn((channel: string, data: any) => {
        ipcMainEmitter.emit(channel, {}, data);
      }),
    };

    const mockBrowserWindow = {
      webContents: {
        send: jest.fn((channel: string, data: any) => {
          ipcRendererEmitter.emit(channel, {}, data);
        }),
      },
    };

    class MainTransport extends ElectronTransport.Main<{ emit: Internal }> {
      async test() {
        return await this.emit('test');
      }
    }

    class RendererTransport
      extends ElectronTransport.Renderer
      implements Internal
    {
      @listen
      async test() {
        return 'custom channel test';
      }
    }

    const customChannel = 'my-custom-channel';
    const main = new MainTransport({
      ipcMain: mockIpcMain as any,
      browserWindow: mockBrowserWindow as any,
      channel: customChannel,
    });

    const renderer = new RendererTransport({
      ipcRenderer: mockIpcRenderer as any,
      channel: customChannel,
    });

    const result = await main.test();
    expect(result).toBe('custom channel test');
    expect(mockIpcMain.on).toHaveBeenCalledWith(
      customChannel,
      expect.any(Function)
    );
    expect(mockIpcRenderer.on).toHaveBeenCalledWith(
      customChannel,
      expect.any(Function)
    );
  });

  test('electron main dispose', async () => {
    const ipcMainEmitter = new EventEmitter();
    const mockIpcMain = {
      on: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcMainEmitter.off(channel, handler);
      }),
    };

    const mockBrowserWindow = {
      webContents: {
        send: jest.fn(),
      },
    };

    class MainTransport extends ElectronTransport.Main {}

    const main = new MainTransport({
      ipcMain: mockIpcMain as any,
      browserWindow: mockBrowserWindow as any,
    });

    main.dispose();
    expect(mockIpcMain.off).toHaveBeenCalled();
  });

  test('electron renderer dispose', async () => {
    const ipcRendererEmitter = new EventEmitter();
    const mockIpcRenderer = {
      on: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.on(channel, handler);
      }),
      off: jest.fn((channel: string, handler: any) => {
        ipcRendererEmitter.off(channel, handler);
      }),
      send: jest.fn(),
    };

    class RendererTransport extends ElectronTransport.Renderer {}

    const renderer = new RendererTransport({
      ipcRenderer: mockIpcRenderer as any,
    });

    renderer.dispose();
    expect(mockIpcRenderer.off).toHaveBeenCalled();
  });
});
