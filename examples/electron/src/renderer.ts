import { ElectronTransport, Receiver, Respond, respond } from 'data-transport';
import { Renderer, Main } from './interface';

class RendererTransport
  extends ElectronTransport.Renderer<Renderer>
  implements Receiver<Main> {
  @respond
  help({ request, callback }: Respond<Main['help']>) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(window as any).rendererTransport = new RendererTransport();
