import {
  BrowserExtensionsTransport,
  respond,
  Receiver,
  Respond,
} from 'data-transport';
import {
  BackgroundToClient,
  ClientToBackground,
  PopupToBackground,
} from '../../interface';

class BackgroundTransport
  extends BrowserExtensionsTransport<BackgroundToClient>
  implements Receiver<ClientToBackground & PopupToBackground> {
  showText() {
    return this.emit('changeTextDisplay', { status: true });
  }

  @respond
  toggleText({ request, callback }: Respond<ClientToBackground['toggleText']>) {
    callback({
      status: !request.status,
    });
  }

  @respond
  openClient({ request }: Respond<PopupToBackground['openClient']>) {
    window.open(request.path, '', request.features);
  }
}

const backgroundTransport = new BackgroundTransport();

(window as any).backgroundTransport = backgroundTransport;

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   //
// });

// chrome.tabs.onRemoved.addListener((tabId) => {
//   //
// });

// chrome.tabs.onActiveChanged.addListener((tabId) => {
//   //
// });

// chrome.windows.onFocusChanged.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     //
//   });
// });
