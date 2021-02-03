export const listenerKey: unique symbol = Symbol('listener');
export const senderKey: unique symbol = Symbol('sender');
export const requestsMapKey: unique symbol = Symbol('requestsMap');
export const listensMapKey: unique symbol = Symbol('listensMapKey');
export const originalListensMapKey: unique symbol = Symbol(
  'originalListensMap'
);
export const callbackKey: unique symbol = Symbol('callback');
export const timeoutKey: unique symbol = Symbol('timeout');
export const prefixKey: unique symbol = Symbol('prefix');
export const produceKey: unique symbol = Symbol('produce');
export const transportKey = '__DATA_TRANSPORT_UUID__';
export const transportType = {
  request: 'request',
  response: 'response',
} as const;
