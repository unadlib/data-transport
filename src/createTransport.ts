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
import type { BaseInteraction, TransportOptions } from './interface';

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

export interface Transports<T extends BaseInteraction = any> {
  Base: Transport<T>;
  MessageTransport: MessageTransport<T>;
  IFrameMain: IFrameMainTransport<T>;
  IFrameInternal: IFrameInternalTransport<T>;
  SharedWorkerClient: SharedWorkerClientTransport<T>;
  SharedWorkerInternal: SharedWorkerInternalTransport<T>;
  ServiceWorkerClient: ServiceWorkerClientTransport<T>;
  ServiceWorkerService: ServiceWorkerServiceTransport<T>;
  WebWorkerClient: WorkerMainTransport<T>;
  WebWorkerInternal: WorkerInternalTransport<T>;
  BrowserExtensions: BrowserExtensionsGenericTransport<T>;
  BrowserExtensionsMain: BrowserExtensionsMainTransport<T>;
  BrowserExtensionsClient: BrowserExtensionsClientTransport<T>;
  ElectronMain: ElectronMainTransport<T>;
  ElectronRenderer: ElectronRendererTransport<T>;
  WebRTC: WebRTCTransport<T>;
  Broadcast: BroadcastTransport<T>;
  MainProcess: MainProcessTransport<T>;
  ChildProcess: ChildProcessTransport<T>;
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
export const createTransport = <
  T extends keyof typeof TransportMap,
  I extends BaseInteraction = any
>(
  name: T,
  options: TransportOptionsMap[T]
): Transports<I>[T] => {
  return new (TransportMap[name] as any)(options);
};
