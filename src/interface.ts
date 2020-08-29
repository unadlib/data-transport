export type Receiver<T extends TransportDataMap> = {
  [P in keyof T]: (request: T[P]['request']) => void;
};

export type Request<T extends TransportData<any, any>> = T['request'];

export type TransportDataMap = Record<string, TransportData<any, any>>;

export interface TransportData<T, S> {
  request: T;
  response: S;
}

export type Response<T extends TransportData<any, any>> = T['response'];