import { v4 } from 'uuid';
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
} from './constant';
import {
  EmitOptions,
  IRequest,
  IResponse,
  ListenerOptions,
  Request,
  ListensMap,
  Response,
  TransportOptions,
} from './interface';

const defaultTimeout = 60 * 1000;
const defaultPrefix = 'DataTransport';
const getAction = (prefix: string, name: string) =>
  `${prefix}-${name.toString()}`;
const getListenName = (prefix: string, action: string) =>
  action.replace(new RegExp(`^${prefix}-`), '');

export abstract class Transport<T = {}, P = {}> {
  private [listenerKey]: TransportOptions['listener'];
  private [senderKey]: TransportOptions['sender'];
  private [timeoutKey]: TransportOptions['timeout'];
  private [prefixKey]: TransportOptions['prefix'];
  private [requestsMapKey]: Map<string, (value: unknown) => void> = new Map();
  private [listensMapKey]!: ListensMap;
  private [originalListensMapKey]!: Record<string, Function>;

  constructor({
    listener,
    sender,
    timeout = defaultTimeout,
    verbose = false,
    prefix = defaultPrefix,
    listenKeys = [],
  }: TransportOptions) {
    this[listensMapKey] ??= {};
    this[originalListensMapKey] ??= {};
    this[listenerKey] = listener;
    this[senderKey] = sender;
    this[timeoutKey] = timeout;
    this[prefixKey] = prefix;

    listenKeys.forEach((key) => {
      const fn = ((this as any) as Record<string, Function>)[key];
      if (__DEV__) {
        if (typeof fn !== 'function') {
          console.warn(
            `In '${this.constructor.name}' class, '${key}' is NOT a methods.`
          );
        }
      }
      this[originalListensMapKey][key] = fn;
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

    Object.entries(this[originalListensMapKey]).forEach(([name, fn]) => {
      this[produceKey](name, fn);
    });

    this[listenerKey].call(this, (options: ListenerOptions) => {
      if (verbose) {
        if (typeof verbose === 'function') {
          verbose(options);
        } else {
          console.info('DataTransport Receive: ', options);
        }
      }
      if (options[transportKey]) {
        const listenName = getListenName(this[prefixKey]!, options.action);
        const hasListen = typeof (this as any)[listenName] === 'function';
        if ((options as IResponse).type === transportType.response) {
          const resolve = this[requestsMapKey].get(options[transportKey]);
          if (resolve) {
            resolve((options as IResponse).response);
          } else if (hasListen) {
            if (__DEV__) {
              console.warn(
                `The type '${options.action}' event '${options[transportKey]}' has been resolved. Please check for a duplicate response.`
              );
            }
          }
        } else if ((options as IRequest).type === transportType.request) {
          const respond = this[listensMapKey][options.action];
          if (typeof respond === 'function') {
            respond((options as IRequest).request, {
              ...options,
              transportId: options[transportKey],
              hasRespond: (options as IRequest).hasRespond,
            });
          } else if (hasListen) {
            if (__DEV__) {
              console.error(
                `In '${this.constructor.name}' class, the listen method '${listenName}' is NOT decorated by decorator '@listen' or be added 'listenKeys' list.`
              );
            }
          }
        }
      }
    });
  }

  private [produceKey]<K extends string, P extends Record<string, Function>>(
    name: K,
    fn: P[K]
  ) {
    // https://github.com/microsoft/TypeScript/issues/40465
    const action = getAction(this[prefixKey]!, name);
    this[listensMapKey][action] = async (
      request,
      { hasRespond, transportId, ...args }
    ) => {
      if (typeof fn === 'function') {
        const response: Response<P[K]> = await fn.apply(this, request);
        if (__DEV__) {
          if (!hasRespond) {
            console.warn(
              `The event '${action}' is just an event that doesn't require a response, and doesn't need to perform the callback.`
            );
            return;
          }
        }
        this[senderKey]({
          ...args,
          action,
          response,
          hasRespond,
          [transportKey]: transportId,
          type: transportType.response,
        });
      } else {
        throw new Error(`The listener for event ${name} should be a function.`);
      }
    };
  }

  /**
   * Listen an event that transport data.
   *
   * @param name A transport action as listen message data action type
   * @param fn A transport listener
   */
  listen<K extends keyof P>(name: K, fn: P[K]) {
    if (typeof name === 'string') {
      if (this[originalListensMapKey][name]) {
        if (__DEV__) {
          console.warn(
            `Failed to listen to the event "${name}", the event "${name}" is already listened to.`
          );
        }
        return;
      }
      if (typeof fn === 'function') {
        this[originalListensMapKey][name] = fn;
        this[produceKey](name, fn);
      } else {
        throw new Error(`The listener for event ${name} should be a function.`);
      }
    } else {
      throw new Error(
        `The event name "${name.toString()}" is not a string, it should be a string.`
      );
    }
  }

  /**
   * Emit an event that transport data.
   *
   * @param name A transport action as post message data action type.
   * @param request A request data
   *
   * @returns Return a response for the request.
   */
  emit<K extends keyof T>(name: K, ...request: Request<T[K]>) {
    return this.send({ name }, ...request);
  }

  /**
   * Emit an event that transport data.
   *
   * @param emitOptions A option for the transport data
   * * `name`: A transport action as post message data action type.
   * * `respond`: (optional) A boolean for defined need to be respond.
   * * `timeout`: (optional) A number for defined a timeout for responding.
   * @param request A request data
   *
   * @returns Return a response for the request.
   */
  async send<K extends keyof T>(
    { name, ...options }: EmitOptions<K>,
    ...request: Request<T[K]>
  ): Promise<Response<T[K]>> {
    const hasRespond = options.respond ?? true;
    const timeout = options.timeout ?? this[timeoutKey];
    const transportId = v4({
      // In nodejs, crypto.getRandomValues() not supported.
      // workaround: https://github.com/uuidjs/uuid/issues/375
      rng() {
        const randomNumbers: number[] = new Array(16);
        let r;
        for (let i = 0; i < 16; i++) {
          if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
          randomNumbers[i] = ((r as number) >>> ((i & 0x03) << 3)) & 0xff;
        }
        return randomNumbers;
      },
    });
    const action = getAction(this[prefixKey]!, name as string);
    const data = {
      type: transportType.request,
      action,
      request,
      hasRespond,
      [transportKey]: transportId,
    };
    if (!hasRespond) {
      return new Promise((resolve) => {
        this[senderKey](data);
        resolve(undefined as Response<T[K]>);
      });
    }
    let timeoutId: NodeJS.Timeout | number;
    const promise = Promise.race<any>([
      new Promise((resolve) => {
        this[requestsMapKey].set(transportId, resolve);
        this[senderKey](data);
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(timeoutId);
        }, timeout);
      }),
    ]);
    return promise
      .catch((error) => {
        if (typeof error === 'number') {
          console.warn(
            `The event '${action}' timed out for ${timeout} seconds...`
          );
        } else {
          if (__DEV__) {
            throw error;
          }
        }
      })
      .finally(() => {
        clearTimeout(timeoutId as NodeJS.Timeout);
        this[requestsMapKey].delete(transportId);
      });
  }
}
