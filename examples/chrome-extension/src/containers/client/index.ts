import { BrowserExtensionsClientTransport, listen } from 'data-transport';
import { ClientToBackground, BackgroundToClient } from '../../interface';

class ClientTransport
  extends BrowserExtensionsClientTransport<ClientToBackground>
  implements BackgroundToClient {
  hasDisplay = true;

  async toggleText() {
    const { status } = await this.emit('toggleText', {
      status: this.hasDisplay,
    });
    this.hasDisplay = status;
    this.render();
  }

  @listen
  async changeTextDisplay(options: { status: boolean }) {
    this.hasDisplay = options.status;
    this.render();
    return {
      status: options.status,
    };
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
