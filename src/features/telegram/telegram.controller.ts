import { Body, Controller, Post, Logger, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { TelegramService } from "./telegram.service";
import { ConfigService } from "@nestjs/config";

@ApiTags('Telegram Webhook')
@Controller('telegram')
export class TelegramController {
    private readonly logger = new Logger(TelegramController.name);

    constructor(
        private readonly telegramService: TelegramService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Telegram sends updates to this endpoint.
     * User sends: /start Khan-123
     * Bot finds user by userCode "Khan-123" and saves their chat_id.
     */
    @Post('webhook')
    @ApiOperation({ summary: 'Telegram bot webhook — receives updates from Telegram' })
    async handleWebhook(@Body() update: any) {
        try {
            const message = update?.message;
            if (!message?.text) return { ok: true };

            const chatId = String(message.chat.id);
            const text = message.text.trim();
            const firstName = message.from?.first_name || '';

            // Handle /start command
            if (text.startsWith('/start')) {
                const parts = text.split(' ');
                const userCode = parts[1]?.trim();

                if (!userCode) {
                    // User sent just /start without userCode
                    await this.telegramService.sendMessage(
                        chatId,
                        `👋 Сәлем${firstName ? ', ' + firstName : ''}!\n\n` +
                        `Тіркелу үшін өзіңіздің кодыңызды жіберіңіз:\n` +
                        `<b>/start Khan-123456</b>\n\n` +
                        `(Кодыңызды қосымшадан көре аласыз)`
                    );
                    return { ok: true };
                }

                // Try to link user by userCode
                const result = await this.telegramService.linkUserByChatId(userCode, chatId);

                if (result.success) {
                    await this.telegramService.sendMessage(
                        chatId,
                        `✅ Сәтті тіркелдіңіз!\n\n` +
                        `👤 <b>${result.userName}</b>\n` +
                        `📋 Код: <b>${userCode}</b>\n\n` +
                        `Енді товарларыңыз келгенде хабарлама аласыз 📦`
                    );
                } else {
                    await this.telegramService.sendMessage(
                        chatId,
                        `❌ <b>${userCode}</b> коды бойынша пайдаланушы табылмады.\n\n` +
                        `Кодыңызды тексеріп, қайта жіберіңіз:\n` +
                        `<b>/start Khan-123456</b>`
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Webhook error: ${error.message}`, error.stack);
        }

        return { ok: true };
    }

    /**
     * Call this once to register the webhook URL with Telegram.
     * Example: GET /telegram/set-webhook?url=https://yourdomain.com/telegram/webhook
     */
    @Get('set-webhook')
    @ApiOperation({ summary: 'Register webhook URL with Telegram API' })
    async setWebhook() {
        const botToken = this.configService.getOrThrow('TELEGRAM_BOT_TOKEN');
        const webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL');

        if (!webhookUrl) {
            return { success: false, message: 'TELEGRAM_WEBHOOK_URL is not set in .env' };
        }

        const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: `${webhookUrl}/telegram/webhook` }),
        });
        const data = await res.json();

        this.logger.log(`Set webhook result: ${JSON.stringify(data)}`);
        return data;
    }
}
