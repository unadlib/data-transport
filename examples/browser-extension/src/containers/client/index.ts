import {
  CallBack,
  Receiver,
  BrowserExtensionsTransport,
  Request,
  respond,
} from 'data-transport';
import { ClientToBackground, BackgroundToClient } from '../../interface';

class ClientTransport
  extends BrowserExtensionsTransport<ClientToBackground>
  implements Receiver<BackgroundToClient> {
  hasDisplay = true;

  async toggleText() {
    const { status } = await this.emit('toggleText', {
      status: this.hasDisplay,
    });
    this.hasDisplay = status;
    this.render();
  }

  @respond
  changeTextDisplay(
    request: Request<BackgroundToClient['changeTextDisplay']>,
    callback: CallBack<BackgroundToClient['changeTextDisplay']>
  ) {
    this.hasDisplay = request.status;
    this.render();
    callback({
      status: request.status,
    });
  }

  render() {
    const text = document.getElementById('text')!;
    text.style.display = this.hasDisplay ? 'block' : 'none';
  }
}

const clientTransport = new ClientTransport();

const button = document.getElementById('button');
button!.addEventListener('click', () => {
  clientTransport.toggleText();
});
