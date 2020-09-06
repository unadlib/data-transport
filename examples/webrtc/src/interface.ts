import { TransportData } from 'data-transport';

export type Other = {
  hello: TransportData<{ num: number }, { text: string }>;
};

export type Main = {
  help: TransportData<{ text: string }, { text: string }>;
};
