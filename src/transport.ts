import * as uuid from 'uuid';
import {
  listenKey,
  originalRespondsMapKey,
  requestsMapKey,
  respondsMapKey,
  sendKey,
  timeoutKey,
  transportKey,
} from './constant';
import {
  EmitOptions,
  IRequest,
  IResponse,
  ListenOptions,
  Request,
  Respond,
  Response,
  TransportDataMap,
  TransportOptions,
} from './interface';

const defaultTimeout = 60 * 1000;

export abstract class Transport<T extends TransportDataMap = any> {
  private [listenKey]: TransportOptions['listen'];
  private [sendKey]: TransportOptions['send'];
  private [timeoutKey]: TransportOptions['timeout'];
  private [requestsMapKey]: Map<string, (value: any) => void> = new Map();
  private [respondsMapKey]!: Record<
    string,
    (request: any, options: { hasRespond: boolean; transportId: string }) => any
  >;
  private [originalRespondsMapKey]!: Record<string, Respond>;

  constructor({ listen, send, timeout = defaultTimeout }: TransportOptions) {
    this[respondsMapKey] ??= {};
    this[originalRespondsMapKey] ??= {};
    this[listenKey] = listen;
    this[sendKey] = send;
    this[timeoutKey] = timeout;

    Object.entries(this[originalRespondsMapKey]).forEach(([key, fn]) => {
      this[respondsMapKey][key] = (
        request: any,
        { hasRespond, transportId }
      ) => {
        fn?.call(this, request, (response: any) => {
          if (__DEV__) {
            if (!hasRespond) {
              console.warn(
                `The event '${key}' is just an event that doesn't require a response, and doesn't need to perform the callback.`
              );
              return;
            }
          }
          this[sendKey]({
            type: key,
            response,
            hasRespond,
            [transportKey]: transportId,
          });
        });
      };
    });

    this[listenKey]((listenOptions: ListenOptions) => {
      if (listenOptions[transportKey]) {
        if ((listenOptions as IResponse).response) {
          const resolve = this[requestsMapKey].get(listenOptions[transportKey]);
          if (resolve) {
            resolve((listenOptions as IResponse).response);
          }
        } else if ((listenOptions as IRequest).request) {
          const respond = this[respondsMapKey][listenOptions.type];
          if (typeof respond === 'function') {
            respond((listenOptions as IRequest).request, {
              transportId: listenOptions[transportKey],
              hasRespond: (listenOptions as IRequest).hasRespond,
            });
          } else {
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

  protected async emit<K extends keyof T>(
    type: K,
    request: Request<T[K]>,
    options: EmitOptions = {}
  ): Promise<Response<T[K]>> {
    const hasRespond = options.respond ?? true;
    const timeout = options.timeout ?? this[timeoutKey];
    const transportId = uuid.v4();
    if (!hasRespond) {
      return new Promise((resolve) => {
        this[sendKey]({
          type: type as string,
          request,
          hasRespond,
          [transportKey]: transportId,
        });
        resolve();
      });
    }
    let timeoutId: NodeJS.Timeout | number;
    const promise = Promise.race([
      new Promise((resolve) => {
        this[requestsMapKey].set(transportId, resolve);
        this[sendKey]({
          type: type as string,
          request,
          hasRespond,
          [transportKey]: transportId,
        });
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
