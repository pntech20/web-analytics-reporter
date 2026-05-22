export interface TelegramMessageOptions {
  botToken: string;
  chatId: string;
  disableWebPagePreview?: boolean;
  text: string;
}

export interface TelegramDestinationOptions {
  botToken: string;
  chatId?: string;
  disableWebPagePreview?: boolean;
}

export interface TelegramReport {
  chatId?: string;
  siteId?: string;
  siteName?: string;
  text: string;
}

export interface TelegramDestination {
  type: "telegram";
  send(report: TelegramReport): Promise<object>;
}

export function sendTelegramMessage(options: TelegramMessageOptions): Promise<object>;
export function telegramDestination(options: TelegramDestinationOptions): TelegramDestination;
