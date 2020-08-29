import { Request, Response, TransportDataMap } from './interface';

interface Options {
  listen: (callback: (...args: any) => void, ...args: any) => void;
  send: (...args: any) => void;
}

export abstract class Transport<
  T extends TransportDataMap,
  R extends TransportDataMap = any
> {
  protected _listen: Options['listen'];
  protected _send: Options['send'];

  constructor(options: Options) {
    this._listen = options.listen;
    this._send = options.send;
  }

  public async emit<K extends keyof T>(
    type: K,
    request: Request<T[K]>
  ): Promise<Response<T[K]>> {
    return null;
  }

  public respond<K extends keyof R>(type: K, response: Response<R[K]>) {
    //
  }
}
