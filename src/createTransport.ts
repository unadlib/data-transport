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
  BrowserExtensionsTransportOptions,
  SharedWorkerTransport,
  SharedWorkerInternalTransportOptions,
  SharedWorkerMainTransportOptions,
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
  BrowserExtensions: BrowserExtensionsTransportOptions;
  SharedWorkerMain: SharedWorkerMainTransportOptions;
  SharedWorkerInternal: SharedWorkerInternalTransportOptions;
  Base: TransportOptions;
}

const TransportMap = {
  Base: Transport,
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
  BrowserExtensions: BrowserExtensionsTransport,
  SharedWorkerMain: SharedWorkerTransport.Main,
  SharedWorkerInternal: SharedWorkerTransport.Worker,
};

export const createTransport = <T extends keyof TransportOptionsMap>(
  name: T,
  options: TransportOptionsMap[T]
) => {
  return new (TransportMap[name] as any)(options);
};
