import {
  listenerKey,
  originalListensMapKey,
  requestsMapKey,
  listensMapKey,
  senderKey,
  timeoutKey,
  transportKey,
  prefixKey,
  transportType,
  produceKey,
  listenKey,
  serializerKey,
  logKey,
  verboseKey,
} from './constant';
import type {
  EmitOptions,
  IRequest,
  IResponse,
  ListenerOptions,
  Request,
  ListensMap,
  Response,
  TransportOptions,
  EmitParameter,
  BaseInteraction,
} from './interface';
import { generateId } from './utils';

const DEFAULT_TIMEOUT = 60 * 1000;
const DEFAULT_RESPOND = true;
const DEFAULT_SILENT = false;
const DEFAULT_PREFIX = 'DataTransport';

export const getAction = (prefix: string, name: string) =>
  `${prefix}-${name.toString()}`;
const getListenName = (prefix: string, action: string) =>
  action.replace(new RegExp(`^${prefix}-`), '');

/**
 * Create a base transport
 */
export abstract class Transport<T extends BaseInteraction = any> {
  private [listenerKey]: TransportOptions['listener'];
  private [listenKey]: (options?: ListenerOptions) => void;
  private [senderKey]: TransportOptions['sender'];
  private [timeoutKey]: TransportOptions['timeout'];
  private [prefixKey]: TransportOptions['prefix'];
  private [serializerKey]: TransportOptions['serializer'];
  private [requestsMapKey]: Map<string, (value: unknown) => void> = new Map();
  private [listensMapKey]!: ListensMap;
  private [originalListensMapKey]!: Map<string, Function>;
  private [logKey]?: (listenOptions: ListenerOptions<any>) => void;
  private [verboseKey]: boolean;
  /**
   * dispose transport
   */
  public dispose: () => any;

  constructor({
    listener,
    sender,
    timeout = DEFAULT_TIMEOUT,
    verbose = false,
    prefix = DEFAULT_PREFIX,
    listenKeys = [],
    checkListen = true,
    serializer,
    logger,
  }: TransportOptions) {
    this[listensMapKey] = this[listensMapKey] ?? new Map();
    this[originalListensMapKey] = this[originalListensMapKey] ?? new Map();
    this[listenerKey] = listener.bind(this);
    this[senderKey] = sender.bind(this);
    this[timeoutKey] = timeout;
    this[prefixKey] = prefix;
    this[serializerKey] = serializer;
    this[verboseKey] = verbose;
    this[logKey] = logger;

    new Set(listenKeys).forEach((key) => {
      const fn = (this as any as Record<string, Function>)[key];
      if (__DEV__) {
        if (typeof fn !== 'function') {
          console.warn(`'${key}' is NOT a methods or function.`);
        }
      }
      this[originalListensMapKey].set(key, fn);
      Object.assign(this, {
        [key]() {
          if (__DEV__) {
            throw new Error(
              `The method '${key}' is a listen function that can NOT be actively called.`
            );
          }
        },
      });
    });

    this[originalListensMapKey].forEach((value, name) => {
      this[produceKey](name, value);
    });

    this[listenKey] = (options?: ListenerOptions) => {
      if (this[verboseKey]) {
        if (typeof this[logKey] === 'function' && options) {
          this[logKey]!(options);
        } else {
          console.info('DataTransport Receive: ', options);
        }
      }
      if (options?.[transportKey]) {
        const listenName = getListenName(this[prefixKey]!, options.action);
        const hasListen = typeof (this as any)[listenName] === 'function';
        if ((options as IResponse).type === transportType.response) {
          const resolve = this[requestsMapKey].get(options[transportKey]);
          if (resolve) {
            const { response } = options as IResponse;
            resolve(
              typeof response === 'string' && this[serializerKey]?.parse
                ? this[serializerKey]!.parse!(response)
                : response
            );
          } else if (hasListen) {
            if (__DEV__ && checkListen) {
              console.warn(
                `The type '${options.action}' event '${options[transportKey]}' has been resolved. Please check for a duplicate response.`
              );
            }
          }
        } else if ((options as IRequest).type === transportType.request) {
          const respond = this[listensMapKey].get(options.action);
          if (typeof respond === 'function') {
            const { request } = options as IRequest;
            respond(
              typeof request === 'string' && this[serializerKey]?.parse
                ? this[serializerKey]!.parse!(request)
                : request,
              {
                ...options,
                transportId: options[transportKey],
                hasRespond: (options as IRequest).hasRespond,
              }
            );
          } else if (hasListen) {
            if (__DEV__ && checkListen) {
              console.error(
                `The listen method or function '${listenName}' is NOT decorated by decorator '@listen' or be added 'listenKeys' list.`
              );
            }
          }
        }
      }
    };

    const dispose = this[listenerKey](this[listenKey]);

    this.dispose = () => {
      if (typeof dispose === 'function') {
        this[requestsMapKey].clear();
        this[listensMapKey].clear();
        this[originalListensMapKey].clear();
        return dispose();
      } else if (__DEV__) {
        console.warn(
          `The return value of the the '${this.constructor.name}' transport's listener should be a 'dispose' function for removing the listener`
        );
      }
    };
  }

  private [produceKey]<K extends string, P extends Record<string, Function>>(
    name: K,
    fn: P[K]
  ) {
    // https://github.com/microsoft/TypeScript/issues/40465
    const action = getAction(this[prefixKey]!, name);
    this[listensMapKey].set(
      action,
      async (request, { hasRespond, transportId, request: _, ...args }) => {
        if (typeof fn === 'function') {
          const response: Response<P[K]> = await fn.apply(this, request);
          if (!hasRespond) return;
          const data: IResponse = {
            ...args,
            action,
            response: (typeof response !== 'undefined' &&
            this[serializerKey]?.stringify
              ? this[serializerKey]!.stringify!(response)
              : response) as string | undefined,
            hasRespond,
            [transportKey]: transportId,
            type: transportType.response,
            responseId: this.id,
          };
          this[senderKey](data);
        } else {
          throw new Error(
            `The listener for event ${name} should be a function.`
          );
        }
      }
    );
  }

  /**
   * Listen an event that transport data.
   *
   * @param name A transport action as listen message data action type
   * @param fn A transport listener
   */
  public listen<K extends keyof T['listen']>(name: K, fn: T['listen'][K]) {
    if (typeof name === 'string') {
      if (this[originalListensMapKey].get(name)) {
        if (__DEV__) {
          console.warn(
            `Failed to listen to the event "${name}", the event "${name}" is already listened to.`
          );
        }
        return;
      }
      if (typeof fn === 'function') {
        this[originalListensMapKey].set(name, fn);
        this[produceKey](name, fn);
      } else {
        throw new Error(`The listener for event ${name} should be a function.`);
      }
    } else {
      throw new Error(
        `The event name "${name.toString()}" is not a string, it should be a string.`
      );
    }
    return () => {
      this[originalListensMapKey].delete(name);
      const action = getAction(this[prefixKey]!, name);
      this[listensMapKey].delete(action);
    };
  }

  public id = generateId();

  /**
   * Emit an event that transport data.
   *
   * @param emitOptions A option for the transport data
   * @param request A request data
   *
   * @returns Return a response for the request.
   */
  public async emit<K extends keyof T['emit']>(
    options: EmitOptions<K>,
    ...request: Request<T['emit'][K]>
  ): Promise<Response<T['emit'][K]>> {
    const params =
      typeof options === 'object' ? options : ({} as EmitParameter<K>);
    const hasRespond = params.respond ?? DEFAULT_RESPOND;
    const isSilent = params.silent ?? DEFAULT_SILENT;
    const timeout = params.timeout ?? this[timeoutKey];
    const name = params.name ?? options;
    const transportId = generateId();
    if (__DEV__ && (!name || typeof name !== 'string')) {
      throw new Error(`The event name should be a string, and it's required.`);
    }
    const action = getAction(this[prefixKey]!, name as string);
    const rawRequestData: IRequest = {
      ...(params._extra ? { _extra: params._extra } : {}),
      type: transportType.request,
      action,
      request: (typeof request !== 'undefined' && this[serializerKey]?.stringify
        ? this[serializerKey]!.stringify!(request)
        : request) as unknown[],
      hasRespond,
      [transportKey]: transportId,
      requestId: this.id,
    };
    if (this[verboseKey]) {
      if (typeof this[logKey] === 'function') {
        this[logKey]!(rawRequestData);
      } else {
        console.info('DataTransport Send: ', rawRequestData);
      }
    }
    if (!hasRespond) {
      this[senderKey](rawRequestData);
      return Promise.resolve(undefined as Response<T['emit'][K]>);
    }
    let timeoutId: NodeJS.Timeout | number;
    const promise = Promise.race<any>([
      new Promise((resolve) => {
        this[requestsMapKey].set(transportId, resolve);
        this[senderKey](rawRequestData);
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject();
        }, timeout);
      }),
    ]);
    return promise
      .then((response) => {
        // support Safari 10-11.1
        clearTimeout(timeoutId as NodeJS.Timeout);
        this[requestsMapKey].delete(transportId);
        return response;
      })
      .catch((error) => {
        clearTimeout(timeoutId as NodeJS.Timeout);
        this[requestsMapKey].delete(transportId);
        if (typeof error === 'undefined') {
          if (isSilent) return;
          console.warn(
            `The event '${action}' timed out for ${timeout} seconds...`
          );
        } else {
          if (__DEV__) {
            throw error;
          }
        }
      });
  }
}
