import { IFrameTransport, listen } from 'data-transport';
import { Main, IFrame } from './interface';

class IFrameInternalTransport
  extends IFrameTransport.IFrame<IFrame>
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

const useIFrameInternalTransport = () => new IFrameInternalTransport();

const init = () => {
  window.addEventListener('load', () => {
    const iframeTransport = useIFrameInternalTransport();
    const button = document.createElement('button');
    button.textContent = 'sayHello';
    button.onclick = async () => {
      const data = await iframeTransport.sayHello();
      const div = document.createElement('div');
      div.innerText = `${new Date()}: ${data.text}`;
      document.body.appendChild(div);
    };
    document.body.appendChild(button);
  });
};

init();
