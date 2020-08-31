import { transportKey } from './constant';

export type Receiver<T extends TransportDataMap> = {
  [P in keyof T]: (
    request: Request<T[P]>,
    callback: (response: Response<T[P]>) => void
  ) => void;
};

export type Request<T extends TransportData<any, any>> = T['request'];

export type Response<T extends TransportData<any, any>> = T['response'];

export type TransportDataMap = Record<string, TransportData<any, any>>;

/**
 * define request and response interfaces for transport
 */
export interface TransportData<T, S = void> {
  request: T;
  response: S;
}

export interface EmitOptions {
  /**
   * Whether a response is required.
   */
  respond?: boolean;
  /**
   * Timeout for the emitting event.
   */
  timeout?: number;
}

interface Options {
  type: string;
  [transportKey]: string;
  hasRespond: boolean;
}

export interface SendOptions extends Options {
  request?: Request<any>;
  response?: Response<any>;
}

export interface IRequest extends Options {
  request: Request<any>;
}

export interface IResponse extends Options {
  response: Response<any>;
}

export type ListenOptions = IRequest | IResponse;

export interface TransportOptions {
  /**
   * Send method defines an sender to the specified transport.
   */
  send: (options: SendOptions) => void;
  /**
   * Listen method attaches an event handler to the specified transport.
   */
  listen: (callback: (options: ListenOptions) => void) => void;
  /**
   * @description
   * Timeout milliseconds for sending a request.
   */
  timeout?: number;
}

export type CallBack<T extends TransportData<any, any>> = (
  response: Response<T>
) => void;

export type Respond = (request: any, callback: (response: any) => void) => any;
