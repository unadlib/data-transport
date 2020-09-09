import { TransportData } from 'data-transport';

export type Service = {
  hello: TransportData<{ num: number }, { text: string }>;
};

export type Client = {
  help: TransportData<{ text: string }, { text: string }>;
};
