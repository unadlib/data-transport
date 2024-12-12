import { createTransport, mockPorts } from '../src';

global.browser = {
  runtime: {
    connect: jest.fn(),
    sendMessage: jest.fn(),
    onConnect: {
      addListener: jest.fn(),
    },
  },
} as any;

global.BroadcastChannel = class BroadcastChannel {} as any;

test('base merge transport by main', async () => {
  const ports = mockPorts();
  [
    'Base',
    'MessageTransport',
    'IFrameMain',
    'IFrameInternal',
    'BrowserExtensions',
    'BrowserExtensionsMain',
    'BrowserExtensionsClient',
    'ElectronMain',
    'ElectronRenderer',
    'ServiceWorkerClient',
    'ServiceWorkerService',
    'WebWorkerClient',
    'WebWorkerInternal',
    'WebRTC',
    'Broadcast',
    'SharedWorkerClient',
    'SharedWorkerInternal',
    'MainProcess',
    'ChildProcess',
  ].forEach((key) => {
    expect(() => {
      createTransport(key as any, ports.create());
    }).not.toThrowError();
  });
});
