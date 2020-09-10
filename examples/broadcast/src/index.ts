import { BroadcastTransport, Receiver, listen, Respond } from 'data-transport';
import { Other, Main } from './interface';

class MainTransport
  extends BroadcastTransport<Main>
  implements Receiver<Other> {
  async help() {
    const response = await this.emit('help', { text: 'SOS!!!' });
    return response;
  }

  @listen
  hello({ request, respond }: Respond<Other['hello']>) {
    const input = document.getElementById('input') as HTMLInputElement;
    respond({
      text: `hello ${input?.value || 'anonymous'}, ${request.num}`,
    });
  }
}

const useMainTransport = () =>
  new MainTransport({
    broadcastChannel: new BroadcastChannel('test'),
  });

const init = () => {
  window.addEventListener('load', () => {
    const mainTransport = useMainTransport();
    const button = document.createElement('button');
    button.textContent = 'sayHello';
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
