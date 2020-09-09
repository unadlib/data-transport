import { transportKey } from './constant';

interface RespondOptions<R, C> {
  request: R;
  callback: C;
}

export type Receiver<T extends TransportDataMap> = {
  [P in keyof T]: (
    options: RespondOptions<Request<T[P]>, (response: Response<T[P]>) => void>
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
   * @description
   * Send method defines an sender to the specified transport.
   */
  send: (options: SendOptions) => void;
  /**
   * @description
   * Listen method attaches an event handler to the specified transport.
   */
  listen: (callback: (options: ListenOptions) => void) => void;
  /**
   * @description
   * Timeout milliseconds for sending a request.
   */
  timeout?: number;
  /**
   * @description
   * Display verbose receive data log
   */
  verbose?: boolean | ((listenOptions: ListenOptions) => void);
  /**
   * @description
   * Specify a prefix for event types.
   */
  prefix?: string;
}

type CallBack<T extends TransportData<any, any>> = (
  response: Response<T>
) => void;

export type Respond<
  T extends TransportData<any, any> = TransportData<any, any>
> = RespondOptions<Request<T>, CallBack<T>>;

export type RespondsMap = Record<
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
