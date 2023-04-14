import { listen, SharedWorkerTransport } from 'data-transport';
import { Main, Worker } from './interface';

class MainTransport
  extends SharedWorkerTransport.Main<{ emit: Main }>
  implements Worker {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    const div = document.createElement('div');
    div.innerText = `${new Date()}: ${response.text}`;
    document.body.appendChild(div);
  }

  onConnect() {
    console.log('connect');
  }

  @listen
  async hello(options: { num: number }) {
    console.log('receive help', options);
    return {
      text: 'COPY!!!',
    };
  }
}

const worker = new SharedWorker('worker.bundle.js');

(window as any).mainTransport = new MainTransport({
  worker,
});

document.getElementById('btn')?.addEventListener('click', () => {
  (window as any).mainTransport.help();
});
