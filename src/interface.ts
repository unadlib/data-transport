import { transportKey, transportType } from './constant';

interface ListenOptions<T, P> {
  request: T;
  respond: P;
}

// https://github.com/microsoft/TypeScript/issues/15300
export type Receiver<T extends TransportDataMap> = {
  [P in keyof T]: (
    options: ListenOptions<Request<T[P]>, (response: Response<T[P]>) => void>
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

type TransportType = typeof transportType;

interface Options {
  action: string;
  type: TransportType[keyof TransportType];
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

export type ListenerOptions = IRequest | IResponse;

export interface TransportOptions {
  /**
   * @description
   * Send method defines an sender to the specified transport.
   */
  sender: (options: SendOptions) => void;
  /**
   * @description
   * Listen method attaches an event handler to the specified transport.
   */
  listener: (callback: (options: ListenerOptions) => void) => void;
  /**
   * @description
   * Timeout milliseconds for sending a request.
   */
  timeout?: number;
  /**
   * @description
   * Display verbose receive data log
   */
  verbose?: boolean | ((listenOptions: ListenerOptions) => void);
  /**
   * @description
   * Specify a prefix for event types.
   */
  prefix?: string;
  /**
   * @description
   * Specify the method name list of the class to listen.
   */
  listenKeys?: string[];
}

type Respond<T extends TransportData<any, any>> = (
  response: Response<T>
) => void;

export type Listen<
  T extends TransportData<any, any> = TransportData<any, any>
> = ListenOptions<Request<T>, Respond<T>>;

export type ListensMap = Record<
  string,
  (
    request: Request<any>,
    options: {
      hasRespond: Options['hasRespond'];
      transportId: Options[typeof transportKey];
      [key: string]: any;
    }
  ) => any
>;

export type TransferableWorkerData = Record<string, any> & {
  /**
   * Specify data by transferring ownership (transferable objects)
   */
  transfer?: Transferable[];
};

export type WorkerData =
  | TransferableWorkerData
  | any[]
  | string
  | number
  | boolean
  | null
  | undefined;
