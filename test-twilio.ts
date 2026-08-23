import dotenv from "dotenv";
import twilio from "twilio";

// Load environment variables from .env
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
    console.error("❌ Error: Missing Twilio configuration in .env file.");
    console.error("Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER are set.");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

// Replace this with your actual WhatsApp number for testing
const testPhoneNumber = "9324815718"; // e.g. "9876543210"

async function runTest() {
    if (testPhoneNumber === "9324815718") {
        console.error("❌ Error: Please update the testPhoneNumber variable in test-twilio.ts with your number.");
        process.exit(1);
    }

    const formattedPhone = `whatsapp:+91${9324815718}`;
    const fromNumber = whatsappNumber!.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${9324815718}`;
    const messageBody = `Hello Test User!\n\nWelcome to KrishiSetu. We are thrilled to have you join our platform as a farmer.\n\nYour account is now registered and active. Thank you for connecting with us!`;

    console.log(`⏳ Sending test message to ${formattedPhone} from ${fromNumber}...`);

    try {
        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: formattedPhone,
        });
        console.log(`✅ WhatsApp message sent successfully! SID: ${message.sid}`);
    } catch (error) {
        console.error("❌ Failed to send WhatsApp message:", error);
    }
}

runTest();
