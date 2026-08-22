import os
import json
import requests
from typing import Dict, Any

class MultiChannelNotifier:
    """
    Unified multi-channel webhook dispatcher for Faith-OS Quarantine & Incident alerts.
    Supports: Slack, Microsoft Teams, Webex, Google Chat, Telegram, WhatsApp, Zoho Cliq, Zoom.
    """
    def __init__(self):
        self.slack_url = os.getenv("SLACK_WEBHOOK_URL", "")
        self.teams_url = os.getenv("TEAMS_WEBHOOK_URL", "")
        self.webex_url = os.getenv("WEBEX_WEBHOOK_URL", "")
        self.gchat_url = os.getenv("GCHAT_WEBHOOK_URL", "")
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
        self.whatsapp_token = os.getenv("WHATSAPP_API_TOKEN", "")
        self.whatsapp_phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.whatsapp_recipient = os.getenv("WHATSAPP_RECIPIENT_NUMBER", "")
        self.zoho_url = os.getenv("ZOHO_CLIQ_WEBHOOK_URL", "")
        self.zoom_url = os.getenv("ZOOM_INCOMING_WEBHOOK_URL", "")

    def broadcast_alert(self, doc_name: str, reason: str, vendor: str, entity: str, severity: str, confidence: float):
        summary_text = (
            f"🚨 [FAITH-OS QUARANTINE SENTRY - {severity.upper()}]\n"
            f"• Document: {doc_name}\n"
            f"• Reason: {reason}\n"
            f"• Vendor: {vendor}\n"
            f"• Entity Extracted: {entity}\n"
            f"• Confidence: {int(confidence * 100)}%\n"
            f"• Action: Isolated in sovereign quarantine vault."
        )

        # 1. Slack
        if self.slack_url:
            self._post(self.slack_url, {
                "text": f":rotating_light: *[Faith-OS Security Alert - {severity.upper()}]*",
                "blocks": [
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": f"*Ingestion Quarantine Triggered*\n*Document:* `{doc_name}`\n*Reason:* `{reason}`\n*Vendor:* *{vendor}*\n*Contracting Entity:* `{entity}`"}
                    }
                ]
            }, "Slack")

        # 2. Microsoft Teams (Adaptive Card format)
        if self.teams_url:
            self._post(self.teams_url, {
                "type": "message",
                "attachments": [
                    {
                        "contentType": "application/vnd.microsoft.card.adaptive",
                        "content": {
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                            "type": "AdaptiveCard",
                            "version": "1.4",
                            "body": [
                                {"type": "TextBlock", "text": f"🚨 Faith-OS Security Sentry ({severity.upper()})", "weight": "Bolder", "size": "Medium", "color": "Attention"},
                                {"type": "FactSet", "facts": [
                                    {"title": "Document:", "value": doc_name},
                                    {"title": "Reason:", "value": reason},
                                    {"title": "Vendor:", "value": vendor},
                                    {"title": "Detected Party:", "value": entity}
                                ]}
                            ]
                        }
                    }
                ]
            }, "Microsoft Teams")

        # 3. Cisco Webex
        if self.webex_url:
            self._post(self.webex_url, {
                "markdown": f"### 🚨 Faith-OS Quarantine Alert ({severity.upper()})\n- **Document**: `{doc_name}`\n- **Reason**: {reason}\n- **Vendor**: {vendor}\n- **Entity**: `{entity}`"
            }, "Cisco Webex")

        # 4. Google Chat
        if self.gchat_url:
            self._post(self.gchat_url, {
                "cardsV2": [{
                    "cardId": "quarantineCard",
                    "card": {
                        "header": {"title": f"Faith-OS Sentry - {severity.upper()}", "subtitle": reason},
                        "sections": [{
                            "widgets": [
                                {"textParagraph": {"text": f"<b>Document:</b> {doc_name}<br><b>Vendor:</b> {vendor}<br><b>Entity:</b> {entity}"}}
                            ]
                        }]
                    }
                }]
            }, "Google Chat")

        # 5. Telegram
        if self.telegram_bot_token and self.telegram_chat_id:
            tg_url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            self._post(tg_url, {
                "chat_id": self.telegram_chat_id,
                "text": summary_text,
                "parse_mode": "Markdown"
            }, "Telegram")

        # 6. WhatsApp Business Cloud API
        if self.whatsapp_token and self.whatsapp_phone_id and self.whatsapp_recipient:
            wa_url = f"https://graph.facebook.com/v20.0/{self.whatsapp_phone_id}/messages"
            headers = {"Authorization": f"Bearer {self.whatsapp_token}"}
            self._post(wa_url, {
                "messaging_product": "whatsapp",
                "to": self.whatsapp_recipient,
                "type": "text",
                "text": {"body": summary_text}
            }, "WhatsApp", custom_headers=headers)

        # 7. Zoho Cliq
        if self.zoho_url:
            self._post(self.zoho_url, {
                "text": summary_text
            }, "Zoho Cliq")

        # 8. Zoom Incoming Webhook
        if self.zoom_url:
            self._post(self.zoom_url, {
                "content": {
                    "head": {"text": f"Faith-OS Alert: {severity.upper()}"},
                    "body": [{"type": "message", "text": summary_text}]
                }
            }, "Zoom")

        print(f"[Notifier Sentry] Multi-channel alert dispatch complete for {doc_name}.")

    def _post(self, url: str, payload: Dict[str, Any], service_name: str, custom_headers: Dict[str, str] = None):
        headers = {"Content-Type": "application/json"}
        if custom_headers:
            headers.update(custom_headers)
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=4)
            print(f"[Notifier -> {service_name}] Status: {res.status_code}")
        except Exception as e:
            print(f"[Notifier -> {service_name}] Failed to dispatch: {e}")

notifier = MultiChannelNotifier()
