import {
  Receiver,
  Transport,
  Request,
  CallBack,
  respond,
} from 'data-transport';
import { Internal, External } from './interface';

class InternalTransport
  extends Transport<Internal>
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

const init = (load: () => void) => {
  window.addEventListener('load', () => {
    load();
  });
};

init(() => {
  const internalTransport = new InternalTransport({
    listen: (callback) => {
      window.addEventListener('message', ({ data }: MessageEvent<any>) =>
        callback(data)
      );
    },
    send: (message: any) => window.parent.postMessage(message, '*'),
  });

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
