import {
  IFrameTransport,
  IFrameMainTransportOptions,
  IFrameTransportInternalOptions,
  ElectronTransport,
  ElectronMainTransportOptions,
  ElectronRendererTransportOptions,
  ServiceWorkerTransport,
  ServiceWorkerClientTransportOptions,
  ServiceWorkerServiceTransportOptions,
  WorkerTransport,
  WorkerMainTransportOptions,
  WorkerInternalTransportOptions,
  WebRTCTransport,
  WebRTCTransportOptions,
  BroadcastTransport,
  BroadcastTransportOptions,
  BrowserExtensionsTransport,
  BrowserExtensionsMainTransport,
  BrowserExtensionsMainTransportOptions,
  BrowserExtensionsClientTransport,
  BrowserExtensionsClientTransportOptions,
  BrowserExtensionsGenericTransport,
  BrowserExtensionsGenericTransportOptions,
  SharedWorkerTransport,
  SharedWorkerInternalTransportOptions,
  SharedWorkerMainTransportOptions,
  MessageTransport,
  MessageTransportOptions,
  IFrameMainTransport,
  IFrameInternalTransport,
  ElectronMainTransport,
  ElectronRendererTransport,
  ServiceWorkerClientTransport,
  ServiceWorkerServiceTransport,
  WorkerInternalTransport,
  WorkerMainTransport,
  SharedWorkerMainTransport,
  SharedWorkerInternalTransport,
  ProcessTransport,
  MainProcessTransport,
  ChildProcessTransport,
  MainProcessTransportOptions,
  ChildProcessTransportOptions,
} from './transports';
import { Transport } from './transport';
import type { TransportOptions } from './interface';

interface TransportOptionsMap {
  IFrameMain: IFrameMainTransportOptions;
  IFrameInternal: IFrameTransportInternalOptions;
  BrowserExtensions: BrowserExtensionsGenericTransportOptions;
  BrowserExtensionsMain: BrowserExtensionsMainTransportOptions;
  BrowserExtensionsClient: BrowserExtensionsClientTransportOptions;
  ElectronMain: ElectronMainTransportOptions;
  ElectronRenderer: ElectronRendererTransportOptions;
  ServiceWorkerClient: ServiceWorkerClientTransportOptions;
  ServiceWorkerService: ServiceWorkerServiceTransportOptions;
  WorkerMain: WorkerMainTransportOptions;
  WorkerInternal: WorkerInternalTransportOptions;
  WebRTC: WebRTCTransportOptions;
  Broadcast: BroadcastTransportOptions;
  SharedWorkerMain: SharedWorkerMainTransportOptions;
  SharedWorkerInternal: SharedWorkerInternalTransportOptions;
  Base: TransportOptions;
  MessageTransport: MessageTransportOptions;
  MainProcess: MainProcessTransportOptions;
  ChildProcess: ChildProcessTransportOptions;
}

interface Transports {
  Base: Transport;
  MessageTransport: MessageTransport;
  IFrameMain: IFrameMainTransport;
  IFrameInternal: IFrameInternalTransport;
  SharedWorkerMain: SharedWorkerMainTransport;
  SharedWorkerInternal: SharedWorkerInternalTransport;
  ServiceWorkerClient: ServiceWorkerClientTransport;
  ServiceWorkerService: ServiceWorkerServiceTransport;
  WorkerMain: WorkerMainTransport;
  WorkerInternal: WorkerInternalTransport;
  BrowserExtensions: BrowserExtensionsGenericTransport;
  BrowserExtensionsMain: BrowserExtensionsMainTransport;
  BrowserExtensionsClient: BrowserExtensionsClientTransport;
  ElectronMain: ElectronMainTransport;
  ElectronRenderer: ElectronRendererTransport;
  WebRTC: WebRTCTransport;
  Broadcast: BroadcastTransport;
  MainProcess: MainProcessTransport;
  ChildProcess: ChildProcessTransport;
}

const TransportMap = {
  Base: Transport,
  MessageTransport: MessageTransport,
  IFrameMain: IFrameTransport.Main,
  IFrameInternal: IFrameTransport.IFrame,
  BrowserExtensions: BrowserExtensionsGenericTransport,
  BrowserExtensionsMain: BrowserExtensionsTransport.Main,
  BrowserExtensionsClient: BrowserExtensionsTransport.Client,
  ElectronMain: ElectronTransport.Main,
  ElectronRenderer: ElectronTransport.Renderer,
  ServiceWorkerClient: ServiceWorkerTransport.Client,
  ServiceWorkerService: ServiceWorkerTransport.Service,
  WorkerMain: WorkerTransport.Main,
  WorkerInternal: WorkerTransport.Worker,
  WebRTC: WebRTCTransport,
  Broadcast: BroadcastTransport,
  SharedWorkerMain: SharedWorkerTransport.Main,
  SharedWorkerInternal: SharedWorkerTransport.Worker,
  MainProcess: ProcessTransport.Main,
  ChildProcess: ProcessTransport.Child,
};

/**
 * Create a transport instance.
 *
 * @param name transport type name
 * @param options transport options
 *
 * @returns Return a transport instance.
 */
export const createTransport = <T extends keyof typeof TransportMap>(
  name: T,
  options: TransportOptionsMap[T]
): Transports[T] => {
  return new (TransportMap[name] as any)(options);
};
