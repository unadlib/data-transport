import browser from 'webextension-polyfill';
import { BrowserExtensionsClientTransport } from 'data-transport';
import { PopupToBackground } from '../interface';

class PopupTransport extends BrowserExtensionsClientTransport<{ emit: PopupToBackground }> {
  openClient() {
    this.emit(
      {
        name: 'openClient',
        respond: false,
      },
      {
        path: 'option.html',
        features: 'width=300,height=600',
      }
    );
  }
}

const transport = new PopupTransport({
  browser: browser as any,
  verbose: true,
});

const button = document.getElementById('button');
button!.addEventListener('click', () => {
  transport.openClient();
});

(global as any).transport = transport;

transport.onConnect(() => {
  console.log('connect');
});

// @ts-ignore
transport.listen('a', () => {
  console.log('a event in popup');
});

