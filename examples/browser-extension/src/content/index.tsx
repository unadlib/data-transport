import React from 'react';
import { createRoot } from 'react-dom/client';

import browser from 'webextension-polyfill';
import { createTransport } from 'data-transport';

import App from './components/app';

import './index.scss';

const container = document.createElement('popup');
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);

console.log('Content Script 👋');

const transport = createTransport('BrowserExtensionsClient', {
  browser: browser as any,
});

transport.onConnect(() => {
  console.log('connect');
});

(global as any).transport = transport;

console.log('transport:', transport);

// @ts-ignore
transport.listen('a', () => {
  console.log('a event in content script');
});

setTimeout(async () => {
  console.log('send contentToBg');
  const a = await transport.emit('contentToBg', 1, 2);
  console.log('a:', a);
}, 1000 * 10);
