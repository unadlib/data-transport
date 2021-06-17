import { transportKey, transportType } from './constant';

export type Request<T> = T extends (...args: infer P) => any ? P : never;

export type Response<T> = T extends (...args: any) => Promise<infer P>
  ? P
  : never;

export interface EmitParameter<T> {
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

export type EmitOptions<T> = T | EmitParameter<T>;

type TransportType = typeof transportType;

interface Options {
  action: string;
  type: TransportType[keyof TransportType];
  [transportKey]: string;
  hasRespond: boolean;
}

export type SendOptions<T = {}> = T &
  Options & {
    request?: Request<any>;
    response?: Response<any>;
  };

export type IRequest<T = {}> = T &
  Options & {
    request: Request<any>;
  };

export type IResponse<T = {}> = T &
  Options & {
    response: Response<any>;
  };

export type ListenerOptions<T = {}> = IRequest<T> | IResponse<T>;

export type ListenCallback<T = {}> = (options: ListenerOptions<T>) => void;

export interface TransportOptions<T = {}> {
  /**
   * @description
   * Send method defines an sender to the specified transport.
   */
  sender: (options: SendOptions<T>) => void;
  /**
   * @description
   * Listen method attaches an event handler to the specified transport, and optionally returns a 'dispose' function to remove the listener.
   */
  listener: (
    callback: (options: ListenerOptions<T>) => void
  ) => (() => void) | void;
  /**
   * @description
   * Timeout milliseconds for sending a request.
   */
  timeout?: number;
  /**
   * @description
   * Display verbose receive data log.
   */
  verbose?: boolean | ((listenOptions: ListenerOptions<T>) => void);
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
  /**
   * @description
   * Check the unexpected listen.
   */
   checkListen?: boolean;
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

export interface TransferableWorker {
  /**
   * Specify data by transferring ownership (transferable objects)
   */
  transfer?: Transferable[];
}
