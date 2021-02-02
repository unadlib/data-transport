export interface Main {
  help(options: { text: string }): Promise<{ text: string }>;
}
