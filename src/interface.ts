import { transportKey, transportType } from './constant';

export type Request<T> = T extends (...args: infer P) => any ? P : never;

export type Response<T> = T extends (...args: any) => Promise<infer P>
  ? P
  : never;

export interface EmitOptions<T> {
  /**
   * Emit with the event name.
   */
  name: T;
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
