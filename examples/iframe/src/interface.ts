export type IFrame = {
  hello(options: { num: number }): Promise<{ text: string }>;
}

export type Main = {
  help(options: { text: string }): Promise<{ text: string }>;
}
