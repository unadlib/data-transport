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
} from './transports';
import { Transport } from './transport';
import { TransportOptions } from './interface';

interface TransportOptionsMap {
  IFrameMain: IFrameMainTransportOptions;
  IFrameInternal: IFrameTransportInternalOptions;
  ElectronMain: ElectronMainTransportOptions;
  ElectronRenderer: ElectronRendererTransportOptions;
  ServiceWorkerClient: ServiceWorkerClientTransportOptions;
  ServiceWorkerService: ServiceWorkerServiceTransportOptions;
  WorkerMain: WorkerMainTransportOptions;
  WorkerInternal: WorkerInternalTransportOptions;
  WebRTC: WebRTCTransportOptions;
  Broadcast: BroadcastTransportOptions;
  BrowserExtensions: BrowserExtensionsGenericTransportOptions;
  BrowserExtensionsMain: BrowserExtensionsMainTransportOptions;
  BrowserExtensionsClient: BrowserExtensionsClientTransportOptions;
  SharedWorkerMain: SharedWorkerMainTransportOptions;
  SharedWorkerInternal: SharedWorkerInternalTransportOptions;
  Base: TransportOptions;
  MessageTransport: MessageTransportOptions;
}

interface Transports {
  Base: Transport;
  MessageTransport: MessageTransport;
  IFrameMain: IFrameMainTransport;
  IFrameInternal: IFrameInternalTransport;
  ElectronMain: ElectronMainTransport;
  ElectronRenderer: ElectronRendererTransport;
  ServiceWorkerClient: ServiceWorkerClientTransport;
  ServiceWorkerService: ServiceWorkerServiceTransport;
  WorkerMain: WorkerMainTransport;
  WorkerInternal: WorkerInternalTransport;
  WebRTC: WebRTCTransport;
  Broadcast: BroadcastTransport;
  BrowserExtensions: BrowserExtensionsGenericTransport;
  BrowserExtensionsMain: BrowserExtensionsMainTransport;
  BrowserExtensionsClient: BrowserExtensionsClientTransport;
  SharedWorkerMain: SharedWorkerMainTransport;
  SharedWorkerInternal: SharedWorkerInternalTransport;
}

const TransportMap = {
  Base: Transport,
  MessageTransport: MessageTransport,
  IFrameMain: IFrameTransport.Main,
  IFrameInternal: IFrameTransport.IFrame,
  ElectronMain: ElectronTransport.Main,
  ElectronRenderer: ElectronTransport.Renderer,
  ServiceWorkerClient: ServiceWorkerTransport.Client,
  ServiceWorkerService: ServiceWorkerTransport.Service,
  WorkerMain: WorkerTransport.Main,
  WorkerInternal: WorkerTransport.Worker,
  WebRTC: WebRTCTransport,
  Broadcast: BroadcastTransport,
  BrowserExtensions: BrowserExtensionsGenericTransport,
  SharedWorkerMain: SharedWorkerTransport.Main,
  SharedWorkerInternal: SharedWorkerTransport.Worker,
  BrowserExtensionsMain: BrowserExtensionsTransport.Main,
  BrowserExtensionsClient: BrowserExtensionsTransport.Client,
};

/**
 * Create a transport instance.
 *
 * @param name transport type name
 * @param options transport options
 *
 * @returns Return a transport instance.
 */
export const createTransport = <T extends keyof TransportOptionsMap>(
  name: T,
  options: TransportOptionsMap[T]
): Transports[T] => {
  return new (TransportMap[name] as any)(options);
};
