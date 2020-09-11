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
const defaultPrefix = 'DataTransport-';
const getType = (prefix: string, name: string) => `${prefix}${name}`;
const getListenerName = (prefix: string, type: string) =>
  type.replace(new RegExp(`^${prefix}`), '');

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
  }: TransportOptions) {
    this[listensMapKey] ??= {};
    this[originalListensMapKey] ??= {};
    this[listenerKey] = listener;
    this[senderKey] = sender;
    this[timeoutKey] = timeout;
    this[prefixKey] = prefix;

    Object.entries(this[originalListensMapKey]).forEach(([name, fn]) => {
      // https://github.com/microsoft/TypeScript/issues/40465
      const type = getType(this[prefixKey]!, name);
      this[listensMapKey][type] = (
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
                  `The event '${type}' is just an event that doesn't require a response, and doesn't need to perform the callback.`
                );
                return;
              }
            }
            this[senderKey]({
              ...args,
              type,
              response,
              hasRespond,
              [transportKey]: transportId,
            });
          },
        });
      };
    });

    this[listenerKey]((options: ListenerOptions) => {
      if (verbose) {
        if (typeof verbose === 'function') {
          verbose(options);
        } else {
          console.info('DataTransport Receive: ', options);
        }
      }
      if (options[transportKey]) {
        const listenerName = getListenerName(this[prefixKey]!, options.type);
        const hasListener = typeof (this as any)[listenerName] === 'function';
        if ((options as IResponse).response) {
          const resolve = this[requestsMapKey].get(options[transportKey]);
          if (resolve) {
            resolve((options as IResponse).response);
          } else if (hasListener) {
            if (__DEV__) {
              console.warn(
                `The type '${options.type}' event '${options[transportKey]}' has been resolved. Please check for a duplicate response.`
              );
            }
          }
        } else if ((options as IRequest).request) {
          const respond = this[listensMapKey][options.type];
          if (typeof respond === 'function') {
            respond((options as IRequest).request, {
              // `listenOptions` custom fields data from request
              ...options,
              transportId: options[transportKey],
              hasRespond: (options as IRequest).hasRespond,
            });
          } else if (hasListener) {
            if (__DEV__) {
              console.error(
                `In '${this.constructor.name}' class, the listener method '${listenerName}' is NOT decorated by decorator '@listen'.`
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
   * @param type A transport type as post message data type
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
    const type = getType(this[prefixKey]!, name as string);
    const data = {
      type,
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
            `The event '${type}' timed out for ${timeout} seconds...`
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
