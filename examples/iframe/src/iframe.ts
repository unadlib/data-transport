import {
  IFrameTransport,
  Receiver,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class InternalTransport
  extends IFrameTransport.Internal<Internal>
  implements Receiver<External> {
  @respond
  help(
    request: Request<External['help']>,
    callback: CallBack<External['help']>
  ) {
    callback({
      text: 'COPY!!!',
    });
  }

  async sayHello() {
    const response = await this.emit('hello', { num: 42 });
    return response;
  }
}

const init = () => {
  window.addEventListener('load', () => {
    const internalTransport = new InternalTransport();
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
