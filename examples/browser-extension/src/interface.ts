export type PopupToBackground = {
  openClient(options: { path: string; features: string }): Promise<void>;
}

export type BackgroundToClient = {
  changeTextDisplay(options: { status: boolean }): Promise<{ status: boolean }>;
}

export type ClientToBackground = {
  toggleText(options: { status: boolean }): Promise<{ status: boolean }>;
}
