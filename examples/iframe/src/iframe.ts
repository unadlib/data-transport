import { IFrameTransport, Receiver, Respond, respond } from 'data-transport';
import { Internal, External } from './interface';

class InternalTransport
  extends IFrameTransport.Internal<Internal>
  implements Receiver<External> {
  @respond
  help({ request, callback }: Respond<External['help']>) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

const useInternalTransport = () => new InternalTransport();

const init = () => {
  window.addEventListener('load', () => {
    const internalTransport = useInternalTransport();
    const button = document.createElement('button');
    button.textContent = 'sayHello';
    button.onclick = async () => {
      const data = await internalTransport.sayHello();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
