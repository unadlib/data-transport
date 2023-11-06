import { IFrameTransport, listen } from 'data-transport';
import { Main, IFrame } from './interface';

class IFrameInternalTransport
  extends IFrameTransport.IFrame<{ emit: IFrame }>
  implements Main
{
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

const useIFrameInternalTransport = () =>
  new IFrameInternalTransport({
    // prefix: 'test',
  });

const init = () => {
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      const iframeTransport = useIFrameInternalTransport();
      // @ts-ignore
      window.transport = iframeTransport;
      const button = document.createElement('button');
      button.textContent = 'sayHello';
      const handler = async () => {
        const data = await iframeTransport.sayHello();
        const div = document.createElement('div');
        div.innerText = `${new Date()}: ${data.text}`;
        document.body.appendChild(div);
      };
      button.onclick = handler;
      document.body.appendChild(button);
      await handler();
    }, 4000);
  });
};

window.addEventListener('beforeunload', function (e) {
  const confirmationMessage = 'something';
  e.preventDefault(); //
  e.returnValue = confirmationMessage; // Gecko or Trident
  return confirmationMessage; // WebKit
});

init();
