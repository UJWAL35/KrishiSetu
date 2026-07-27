import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

export async function sendWhatsAppWelcomeMessage(phone: string, name: string, role: string) {
    const formattedPhone = `whatsapp:+91${phone}`;
    const messageBody = `Hello ${name}!\n\nWelcome to KrishiSetu. We are thrilled to have you join our platform as a ${role}.\n\nYour account is now registered and active. Thank you for connecting with us!`;

    if (!client || !whatsappNumber) {
        console.log("==========================================");
        console.log("[Mock Twilio] Message not sent because credentials are not configured in .env");
        console.log(`To: ${formattedPhone}`);
        console.log(`Body: ${messageBody}`);
        console.log("==========================================");
        return;
    }

    try {
        const message = await client.messages.create({
            body: messageBody,
            from: whatsappNumber,
            to: formattedPhone,
        });
        console.log(`WhatsApp message sent successfully to ${phone}. SID: ${message.sid}`);
    } catch (error) {
        console.error("Failed to send WhatsApp message via Twilio:", error);
    }
}
