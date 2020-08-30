import * as uuid from 'uuid';
import {
  listenKey,
  originalRespondsMapKey,
  requestsMapKey,
  respondsMapKey,
  sendKey,
  transportKey,
} from './constant';
import {
  IRequest,
  IResponse,
  ListenOptions,
  Request,
  Respond,
  Response,
  TransportDataMap,
  TransportOptions,
} from './interface';

const defaultTimeout = 3 * 1000;

export abstract class Transport<T extends TransportDataMap = any> {
  /**
   * listen for data transfer events on the current transport
   */
  private [listenKey]: TransportOptions['listen'];
  /**
   *
   */
  private [sendKey]: TransportOptions['send'];
  private [requestsMapKey]: Map<string, (value: any) => void> = new Map();
  private [respondsMapKey]!: Record<
    string,
    (request: any, transportId: string) => any
  >;
  private [originalRespondsMapKey]!: Record<string, Respond>;

  constructor(options: TransportOptions) {
    this[respondsMapKey] ??= {};
    this[originalRespondsMapKey] ??= {};

    Object.entries(this[originalRespondsMapKey]).forEach(([key, fn]) => {
      this[respondsMapKey][key] = (request: any, transportId) => {
        fn?.call(this, request, (response: any) =>
          this[sendKey]({
            type: key,
            response,
            [transportKey]: transportId,
          })
        );
      };
    });

    this[listenKey] = options.listen;
    this[sendKey] = options.send;
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
            respond(
              (listenOptions as IRequest).request,
              listenOptions[transportKey]
            );
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
    request: Request<T[K]>
  ): Promise<Response<T[K]>> {
    let timeoutId: number;
    const transportId = uuid.v4();
    const promise = Promise.race([
      new Promise((resolve) => {
        this[requestsMapKey].set(transportId, resolve);
        this[sendKey]({
          type: type as string,
          request,
          [transportKey]: transportId,
        });
      }),
      new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(timeoutId);
        }, defaultTimeout);
      }),
    ]);
    return promise
      .catch((error) => {
        if (typeof error === 'number') {
          console.warn(`Event '${type}' timed out.`);
        } else {
          if (__DEV__) {
            throw error;
          }
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        this[requestsMapKey].delete(transportId);
      });
  }
}
