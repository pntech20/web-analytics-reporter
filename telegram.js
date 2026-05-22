async function sendTelegramMessage(options) {
  if (!options || !options.botToken) throw new Error("Telegram bot token is required.");
  if (!options.chatId) throw new Error("Telegram chat ID is required.");
  if (!options.text) throw new Error("Telegram message text is required.");

  const response = await fetch(`https://api.telegram.org/bot${options.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      chat_id: options.chatId,
      text: options.text,
      disable_web_page_preview: options.disableWebPagePreview !== false
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(`Telegram send failed: ${payload.description || response.status}`);
  }

  return payload;
}

function telegramDestination(options) {
  if (!options) throw new Error("telegramDestination requires options.");

  return {
    async send(report) {
      const chatId = report.chatId || options.chatId;
      if (!chatId) throw new Error(`Missing Telegram chat ID for site "${report.siteId || report.siteName}".`);

      return sendTelegramMessage({
        botToken: options.botToken,
        chatId,
        text: report.text,
        disableWebPagePreview: options.disableWebPagePreview
      });
    },
    type: "telegram"
  };
}

module.exports = {
  sendTelegramMessage,
  telegramDestination
};
