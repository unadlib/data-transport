import { BroadcastTransport, listen } from 'data-transport';
import { Other, Main } from './interface';

class MainTransport extends BroadcastTransport<{ emit: Main }> implements Other {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  async hello(options: { num: number }) {
    const input = document.getElementById('input') as HTMLInputElement;
    return {
      text: `hello ${input?.value || 'anonymous'}, ${options.num}`,
    };
  }
}

const useMainTransport = () => new MainTransport();

const init = () => {
  window.addEventListener('load', () => {
    const mainTransport = useMainTransport();
    const button = document.createElement('button');
    button.textContent = 'help';
    button.onclick = async () => {
      const data = await mainTransport.help();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
