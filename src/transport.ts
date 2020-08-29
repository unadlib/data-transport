import { Request, Response, Receiver, TransportDataMap } from './interface';

export abstract class Transport<
  T extends TransportDataMap,
  R extends TransportDataMap = any
> {
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
