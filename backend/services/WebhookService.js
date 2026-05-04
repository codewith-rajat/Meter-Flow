import axios from "axios";

export class WebhookService {
  // Send billing alert webhook
  static async sendBillingAlert(userId, message, data) {
    try {
      const webhook = process.env.WEBHOOK_URL;
      if (!webhook) return;

      await axios.post(webhook, {
        type: "billing_alert",
        userId,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook send error:", err.message);
    }
  }

  // Send rate limit exceeded webhook
  static async sendRateLimitAlert(userId, apiKey, limit) {
    try {
      const webhook = process.env.WEBHOOK_URL;
      if (!webhook) return;

      await axios.post(webhook, {
        type: "rate_limit_exceeded",
        userId,
        apiKey,
        limit,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook send error:", err.message);
    }
  }

  // Send error alert webhook
  static async sendErrorAlert(userId, errorMessage, endpoint) {
    try {
      const webhook = process.env.WEBHOOK_URL;
      if (!webhook) return;

      await axios.post(webhook, {
        type: "error_alert",
        userId,
        errorMessage,
        endpoint,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Webhook send error:", err.message);
    }
  }
}

export default WebhookService;
