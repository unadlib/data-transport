export type Service = {
  hello(options: { num: number }): Promise<{ text: string }>;
}

export type Client = {
  help(options: { text: string }): Promise<{ text: string }>;
}
