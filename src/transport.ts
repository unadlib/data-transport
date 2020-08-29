import { Request, Response, TransportDataMap } from './interface';

export abstract class Transport<T extends TransportDataMap> {
  public async emit<K extends keyof T>(
    type: K,
    request: Request<T[K]>
  ): Promise<Response<T[K]>> {
    return null;
  }

  public respond<K extends keyof T>(type: K, response: Response<T[K]>) {
    //
  }
}
