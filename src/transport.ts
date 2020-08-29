import uuid from 'uuid';
import {
  ListenOptions,
  Request,
  SendOptions,
  Response,
  TransportDataMap,
  TransportOptions,
} from './interface';

const transportKey = '__transport_uuid__';
const defaultTimeout = 60 * 1000; // 1 min

export abstract class Transport<
  T extends TransportDataMap,
  R extends TransportDataMap = any
> {
  protected _listen: TransportOptions['listen'];
  protected _send: TransportOptions['send'];
  protected _requestsMap: Map<string, (value: any) => void> = new Map();
  protected _respondsMap!: Record<string, (...args: any) => any>;

  constructor(options: TransportOptions) {
    this._listen = options.listen;
    this._send = options.send;
    this._listen((listenOptions: ListenOptions) => {
      if (listenOptions[transportKey]) {
        if (listenOptions.response) {
          const resolve = this._requestsMap.get(listenOptions[transportKey]);
          if (resolve) {
            resolve(listenOptions);
          }
        } else if (listenOptions.request) {
          const respond = this._respondsMap[listenOptions.type];
          if (typeof respond === 'function') {
            respond(listenOptions.request);
          }
        }
      }
    });
  }

  public async emit<K extends keyof T>(
    type: K,
    request: Request<T[K]>
  ): Promise<Response<T[K]>> {
    let timeoutId: NodeJS.Timeout;
    const transportId = uuid.v4();
    const promise = Promise.race([
      new Promise((resolve) => {
        this._requestsMap.set(transportId, resolve);
        this._send({ type, request, [transportKey]: transportId });
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject();
        }, defaultTimeout);
      }),
    ]);
    return promise
      .catch(() => {
        console.warn(`Event ${type} timed out.`);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        this._requestsMap.delete(transportId);
      });
  }

  public respond<K extends keyof R>(type: K, response: Response<R[K]>) {
    // this._send({ type, response, [transportKey]: transportId });
  }
}
