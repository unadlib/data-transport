import { v4 } from 'uuid';
import {
  listenKey,
  originalRespondsMapKey,
  requestsMapKey,
  respondsMapKey,
  sendKey,
  timeoutKey,
  transportKey,
  prefixKey,
} from './constant';
import {
  EmitOptions,
  IRequest,
  IResponse,
  ListenOptions,
  Request,
  Respond,
  RespondsMap,
  Response,
  TransportDataMap,
  TransportOptions,
} from './interface';

const defaultTimeout = 60 * 1000;
const defaultPrefix = 'DataTransport-';
const getType = (prefix: string, name: string) => `${prefix}${name}`;

export abstract class Transport<T extends TransportDataMap = any> {
  private [listenKey]: TransportOptions['listen'];
  private [sendKey]: TransportOptions['send'];
  private [timeoutKey]: TransportOptions['timeout'];
  private [prefixKey]: TransportOptions['prefix'];
  private [requestsMapKey]: Map<string, (value: any) => void> = new Map();
  private [respondsMapKey]!: RespondsMap;
  private [originalRespondsMapKey]!: Record<
    string,
    (options: Respond) => void | Promise<void>
  >;

  constructor({
    listen,
    send,
    timeout = defaultTimeout,
    verbose = false,
    prefix = defaultPrefix,
  }: TransportOptions) {
    this[respondsMapKey] ??= {};
    this[originalRespondsMapKey] ??= {};
    this[listenKey] = listen;
    this[sendKey] = send;
    this[timeoutKey] = timeout;
    this[prefixKey] = prefix;

    Object.entries(this[originalRespondsMapKey]).forEach(([name, fn]) => {
      // https://github.com/microsoft/TypeScript/issues/40465
      const type = getType(this[prefixKey]!, name);
      this[respondsMapKey][type] = (
        request,
        // `args` for custom fields data from `listenOptions` request
        { hasRespond, transportId, ...args }
      ) => {
        fn?.call(this, {
          request,
          callback: (response: any) => {
            if (__DEV__) {
              if (!hasRespond) {
                console.warn(
                  `The event '${type}' is just an event that doesn't require a response, and doesn't need to perform the callback.`
                );
                return;
              }
            }
            this[sendKey]({
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

    this[listenKey]((listenOptions: ListenOptions) => {
      if (verbose) {
        if (typeof verbose === 'function') {
          verbose(listenOptions);
        } else {
          console.info('DataTransport Receive: ', listenOptions);
        }
      }
      if (listenOptions[transportKey]) {
        const hasListener =
          typeof (this as any)[listenOptions.type] === 'function';
        if ((listenOptions as IResponse).response) {
          const resolve = this[requestsMapKey].get(listenOptions[transportKey]);
          if (resolve) {
            resolve((listenOptions as IResponse).response);
          } else if (hasListener) {
            if (__DEV__) {
              console.warn(
                `The type '${listenOptions.type}' event '${listenOptions[transportKey]}' has been resolved. Please check for a duplicate response.`
              );
            }
          }
        } else if ((listenOptions as IRequest).request) {
          const respond = this[respondsMapKey][listenOptions.type];
          if (typeof respond === 'function') {
            respond((listenOptions as IRequest).request, {
              // `listenOptions` custom fields data from request
              ...listenOptions,
              transportId: listenOptions[transportKey],
              hasRespond: (listenOptions as IRequest).hasRespond,
            });
          } else if (hasListener) {
            if (__DEV__) {
              console.error(
                `In '${this.constructor.name}' class, the listener method '${listenOptions.type}' is NOT decorated by decorator '@respond'.`
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
        this[sendKey](data);
        resolve();
      });
    }
    let timeoutId: NodeJS.Timeout | number;
    const promise = Promise.race([
      new Promise((resolve) => {
        this[requestsMapKey].set(transportId, resolve);
        this[sendKey](data);
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
