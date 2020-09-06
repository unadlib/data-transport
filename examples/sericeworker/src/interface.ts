import { TransportData } from 'data-transport';

export type Internal = {
  hello: TransportData<{ num: number }, { text: string }>;
};

export type External = {
  help: TransportData<{ text: string }, { text: string }>;
};
