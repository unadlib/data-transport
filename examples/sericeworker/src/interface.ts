export interface Service {
  hello(options: { num: number }): Promise<{ text: string }>;
}

export interface Client {
  help(options: { text: string }): Promise<{ text: string }>;
}
