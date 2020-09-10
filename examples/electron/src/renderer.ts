import { ElectronTransport, Receiver, Listen, listen } from 'data-transport';
import { ipcRenderer } from 'electron';
import { Renderer, Main } from './interface';

class RendererTransport
  extends ElectronTransport.Renderer<Renderer>
  implements Receiver<Main> {
  @listen
  help({ request, respond }: Listen<Main['help']>) {
    respond({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(window as any).rendererTransport = new RendererTransport({ ipcRenderer });
