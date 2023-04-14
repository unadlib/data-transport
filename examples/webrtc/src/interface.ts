export type Other = {
  hello(options: { num: number }): Promise<{ text: string }>;
};

export type Main = {
  help(options: {
    text: string;
    bigData: {
      i: number;
    }[];
  }): Promise<{ text: string }>;
};
