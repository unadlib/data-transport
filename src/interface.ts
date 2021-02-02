import { transportKey, transportType } from './constant';

interface ListenOptions<T, P> {
  request: T;
  respond: P;
}

// https://github.com/microsoft/TypeScript/issues/15300
export type Receiver<T> = {
  [P in keyof T]: (
    options: ListenOptions<Request<T[P]>, (response: Response<T[P]>) => void>
  ) => void;
};

export type Request<T> = T extends (options: infer P) => any ? P : never;

export type Response<T> = T extends (...args: any) => Promise<infer P>
  ? P
  : never;

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

type Respond<T> = (response: Response<T>) => void;

export type Listen<T> = ListenOptions<Request<T>, Respond<T>>;

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

export type ListenCallback = (options: Listen<any>) => void | Promise<void>;
