import { ElectronTransport, listen } from 'data-transport';
import { ipcRenderer } from 'electron';
import { Renderer, Main } from './interface';

class RendererTransport
  extends ElectronTransport.Renderer<{ emit: Renderer }>
  implements Main {
  @listen
  async help(options: { text: string }) {
    return {
      text: 'COPY!!!',
    };
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

(window as any).rendererTransport = new RendererTransport({ ipcRenderer });
document.getElementById('btn')?.addEventListener('click', async () => {
  const response = await (window as any).rendererTransport.sayHello();
  const div = document.createElement('div');
  div.innerText = `${new Date()}: ${JSON.stringify(response)}`;
  document.body.appendChild(div);
});
