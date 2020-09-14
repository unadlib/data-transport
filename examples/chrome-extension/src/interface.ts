import { TransportData } from 'data-transport';

export type PopupToBackground = {
  openClient: TransportData<{ path: string; features: string }>;
};

export type BackgroundToClient = {
  changeTextDisplay: TransportData<{ status: boolean }, { status: boolean }>;
};

export type ClientToBackground = {
  toggleText: TransportData<{ status: boolean }, { status: boolean }>;
};
