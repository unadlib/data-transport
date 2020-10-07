import { SharedWorkerTransport } from 'data-transport';
import { Main } from './interface';

class MainTransport extends SharedWorkerTransport.Main<Main> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    const div = document.createElement('div');
    div.innerText = `${new Date()}: ${response.text}`;
    document.body.appendChild(div);
  }

  onConnect() {
    console.log('connect');
  }
}

const worker = new SharedWorker('worker.bundle.js');

(window as any).mainTransport = new MainTransport({
  worker,
});
