import { transportKey, transportType } from './constant';

export interface BaseInteraction {
  listen?: Record<string, (...args: any) => any>;
  emit?: Record<string, (...args: any) => any>;
}

export type Reverse<T extends BaseInteraction> = {
  emit: T['listen'];
  listen: T['emit'];
};

export type MergeInteraction<
  T extends BaseInteraction,
  U extends BaseInteraction
> = (T['listen'] extends undefined
  ? U['listen'] extends undefined
    ? never
    : { listen: U['listen'] }
  : U['listen'] extends undefined
  ? { listen: T['listen'] }
  : { listen: T['listen'] & U['listen'] }) &
  (T['emit'] extends undefined
    ? U['emit'] extends undefined
      ? never
      : { emit: U['emit'] }
    : U['emit'] extends undefined
    ? { emit: T['emit'] }
    : { emit: T['emit'] & U['emit'] });

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
   * Whether a response is required, true by default.
   */
  respond?: boolean;
  /**
   * Timeout for the emitting event, 60s by default.
   */
  timeout?: number;
  /**
   * Extra data for the emitting event.
   */
  _extra?: Record<string, any>;
  /**
   * silent for timeout error, false by default.
   */
  silent?: boolean;
}

export type EmitOptions<T> = T | EmitParameter<T>;

type TransportType = typeof transportType;

interface Options {
  action: string;
  type: TransportType[keyof TransportType];
  [transportKey]: string;
  hasRespond: boolean;
  _extra?: Record<string, any>;
}

export type SendOptions<T = {}> = T &
  Options & {
    request?: string | Response<any>;
    response?: string | Response<any>;
  };

export type IRequest<T = {}> = T &
  Options & {
    requestId: string;
    request: Request<any>;
  };

export type IResponse<T = {}> = T &
  Options & {
    requestId: string;
    responseId: string;
    response: Response<any>;
  };

export type ListenerOptions<T = {}> = IRequest<T> | IResponse<T>;

export type ListenCallback<T = {}> = (options: ListenerOptions<T>) => void;

export interface TransportOptions<T = {}> {
  /**
   * Send method defines an sender to the specified transport.
   */
  sender: (options: SendOptions<T>) => void;
  /**
   * Listen method attaches an event handler to the specified transport, and optionally returns a 'dispose' function to remove the listener.
   */
  listener: (
    callback: (options: ListenerOptions<T>) => void
  ) => (() => void) | void;
  /**
   * Timeout milliseconds for sending a request.
   */
  timeout?: number;
  /**
   * Display verbose receive data log.
   */
  verbose?: boolean;
  /**
   * Specify a prefix for event types.
   */
  prefix?: string;
  /**
   * Specify the method name list of the class to listen.
   */
  listenKeys?: string[];
  /**
   * Check the unexpected listen.
   */
  checkListen?: boolean;
  /**
   * serializer
   */
  serializer?: {
    stringify?: (data: any) => string;
    parse?: (data: string) => any;
  };
  /**
   * logger
   */
  logger?: (listenOptions: ListenerOptions<any>) => void;
}

export type ListensMap = Map<
  string,
  (
    request: Request<any>,
    options: {
      hasRespond: Options['hasRespond'];
      transportId: Options[typeof transportKey];
      requestId: string;
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
