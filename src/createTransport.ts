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
  SharedWorkerClientTransportOptions,
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
  SharedWorkerClientTransport,
  SharedWorkerInternalTransport,
  ProcessTransport,
  MainProcessTransport,
  ChildProcessTransport,
  MainProcessTransportOptions,
  ChildProcessTransportOptions,
} from './transports';
import { Transport } from './transport';
import type { TransportOptions } from './interface';

export interface TransportOptionsMap {
  IFrameMain: IFrameMainTransportOptions;
  IFrameInternal: IFrameTransportInternalOptions;
  BrowserExtensions: BrowserExtensionsGenericTransportOptions;
  BrowserExtensionsMain: BrowserExtensionsMainTransportOptions;
  BrowserExtensionsClient: BrowserExtensionsClientTransportOptions;
  ElectronMain: ElectronMainTransportOptions;
  ElectronRenderer: ElectronRendererTransportOptions;
  ServiceWorkerClient: ServiceWorkerClientTransportOptions;
  ServiceWorkerService: ServiceWorkerServiceTransportOptions;
  WebWorkerClient: WorkerMainTransportOptions;
  WebWorkerInternal: WorkerInternalTransportOptions;
  WebRTC: WebRTCTransportOptions;
  Broadcast: BroadcastTransportOptions;
  SharedWorkerClient: SharedWorkerClientTransportOptions;
  SharedWorkerInternal: SharedWorkerInternalTransportOptions;
  Base: TransportOptions;
  MessageTransport: MessageTransportOptions;
  MainProcess: MainProcessTransportOptions;
  ChildProcess: ChildProcessTransportOptions;
}

export interface Transports {
  Base: Transport;
  MessageTransport: MessageTransport;
  IFrameMain: IFrameMainTransport;
  IFrameInternal: IFrameInternalTransport;
  SharedWorkerClient: SharedWorkerClientTransport;
  SharedWorkerInternal: SharedWorkerInternalTransport;
  ServiceWorkerClient: ServiceWorkerClientTransport;
  ServiceWorkerService: ServiceWorkerServiceTransport;
  WebWorkerClient: WorkerMainTransport;
  WebWorkerInternal: WorkerInternalTransport;
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

export const TransportMap = {
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
  WebWorkerClient: WorkerTransport.Main,
  WebWorkerInternal: WorkerTransport.Worker,
  WebRTC: WebRTCTransport,
  Broadcast: BroadcastTransport,
  SharedWorkerClient: SharedWorkerTransport.Client,
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
