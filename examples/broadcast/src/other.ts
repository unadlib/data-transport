import { BroadcastTransport, Receiver, listen, Listen } from 'data-transport';
import { Other, Main } from './interface';

class OtherTransport
  extends BroadcastTransport<Other>
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

const useOtherTransport = () =>
  new OtherTransport();

const init = () => {
  window.addEventListener('load', () => {
    const otherTransport = useOtherTransport();
    const button = document.createElement('button');
    button.textContent = 'sayHello';
    button.onclick = async () => {
      const data = await otherTransport.sayHello();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
