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
} from './constant';
import {
  EmitOptions,
  IRequest,
  IResponse,
  ListenerOptions,
  Request,
  Listen,
  ListensMap,
  Response,
  TransportDataMap,
  TransportOptions,
} from './interface';

const defaultTimeout = 60 * 1000;
const defaultPrefix = 'DataTransport';
const getAction = (prefix: string, name: string) => `${prefix}-${name}`;
const getListenName = (prefix: string, action: string) =>
  action.replace(new RegExp(`^${prefix}-`), '');

export abstract class Transport<T extends TransportDataMap = any> {
  private [listenerKey]: TransportOptions['listener'];
  private [senderKey]: TransportOptions['sender'];
  private [timeoutKey]: TransportOptions['timeout'];
  private [prefixKey]: TransportOptions['prefix'];
  private [requestsMapKey]: Map<string, (value: any) => void> = new Map();
  private [listensMapKey]!: ListensMap;
  private [originalListensMapKey]!: Record<
    string,
    (options: Listen) => void | Promise<void>
  >;

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
      const fn = (this as any)[key];
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
      // https://github.com/microsoft/TypeScript/issues/40465
      const action = getAction(this[prefixKey]!, name);
      this[listensMapKey][action] = (
        request,
        // `args` for custom fields data from `listenOptions` request
        { hasRespond, transportId, ...args }
      ) => {
        fn?.call(this, {
          request,
          respond: (response) => {
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
          },
        });
      };
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
              // `listenOptions` custom fields data from request
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

  /**
   * Emit an event that transport data.
   *
   * @param action A transport action as post message data action type
   * @param request A request data
   * @param options A option for the transport data
   * * `respond`: (optional) A boolean for defined need to be respond.
   * * `timeout`: (optional) A number for defined a timeout for responding.
   *
   * @returns Return a response for the request.
   */
  protected async emit<K extends keyof T>(
    name: K,
    request: Request<T[K]>,
    options: EmitOptions = {}
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
        resolve();
      });
    }
    let timeoutId: NodeJS.Timeout | number;
    const promise = Promise.race([
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
