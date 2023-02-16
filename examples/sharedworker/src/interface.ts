export type Main = {
  help(options: { text: string }): Promise<{ text: string }>;
};

export type Worker = {
  hello(options: { num: number }): Promise<{ text: string }>;
};
