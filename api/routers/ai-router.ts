import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRouter, publicQuery } from "../middleware";

export const aiRouter = createRouter({
    chat: publicQuery
        .input(
            z.object({
                history: z.array(
                    z.object({
                        role: z.enum(["user", "model"]),
                        parts: z.array(z.object({ text: z.string() })),
                    })
                ),
                message: z.string(),
                userRole: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return {
                    response: "I'm sorry, my AI backend is not configured yet. The GEMINI_API_KEY is missing from the server environment."
                };
            }

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction: `You are FarmAI, a helpful, friendly, and expert agricultural AI assistant for the KrishiSetu platform. 
The user is currently logged in as: ${input.userRole || "farmer"}.
If a farmer asks how to list crops or add crops, guide them step-by-step or offer to help them fill in crop name, category (grains, vegetables, fruits, pulses, others), price in rupees, unit (kg, quintal, piece, etc.), stock quantity, and organic status.
Provide clear, practical, and agriculturally relevant answers. Keep responses well-formatted in concise markdown.`
                });

                const chat = model.startChat({
                    history: input.history,
                });

                const result = await chat.sendMessage(input.message);
                const response = result.response;

                return { response: response.text() };
            } catch (error) {
                console.error("Gemini API Error:", error);
                return {
                    response: "I encountered an error while trying to process your request. Please try again later."
                };
            }
        }),

    extractCropInfo: publicQuery
        .input(
            z.object({
                message: z.string(),
                currentState: z.any(),
                language: z.string().default("English"),
                history: z.array(z.object({ role: z.string(), text: z.string() })).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("GEMINI_API_KEY is missing from the server environment.");
            }

            try {
                const historyText = input.history
                    ? input.history.map(msg => `${msg.role === 'ai' ? 'FarmAI' : 'Farmer'}: ${msg.text}`).join('\n')
                    : "";

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction: `You are a friendly, spoken AI voice assistant helping an Indian farmer list their crop on the KrishiSetu platform.
You MUST communicate strictly in the requested language: ${input.language}.
The data extracted so far is: ${JSON.stringify(input.currentState || {})}
${historyText ? `\nConversation History:\n${historyText}\n` : ''}

REQUIRED FIELDS:
- name (string: crop name, e.g. Tomato, Wheat, Potato, Mango, Cotton, Chana)
- category (string: MUST be strictly one of "grains", "vegetables", "fruits", "pulses", "others")
- price (number: price per unit in Rupees, e.g. 40)
- unit (string: MUST be strictly one of "kg", "gram", "quintal", "dozen", "litre", "piece")
- stock (number: total quantity available, e.g. 100)
- isOrganic (boolean: default false unless the farmer says "organic")

RULES:
1. Extract any mentioned crop details from the user message and merge with existing "data extracted so far".
2. Check which required fields are still missing after merging.
3. If any required field is missing, set isComplete to false and ask for the NEXT single missing field in a warm, natural conversational way in ${input.language}.
   - Ask for only ONE field at a time. Priority: name → category → price → unit → stock → isOrganic
   - Keep questions short and friendly, like a human would ask.
   - Examples: "Tomatoes! How many kilograms do you have to sell?" or "What price per kg are you charging for the wheat?"
4. If ALL required fields (name, category, price, unit, stock) are present, set isComplete to true and set nextQuestion to a warm confirmation/thank-you message in ${input.language}.

CRITICAL OUTPUT RULES — MUST FOLLOW:
- Respond ONLY with a single raw JSON object. No text before or after.
- Do NOT use markdown code blocks (absolutely no backticks, no \`\`\`json, no \`\`\`).
- JSON must always have exactly these three keys: extractedData, nextQuestion, isComplete.
- All string values in extractedData must be in English (crop names, categories, units) even if the conversation is in another language.

Example of a correct response:
{"extractedData":{"name":"Tomato","category":"vegetables","price":null,"unit":"kg","stock":null,"isOrganic":false},"nextQuestion":"Tomatoes! What price per kg are you selling them for?","isComplete":false}`,
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                });

                const result = await model.generateContent(input.message);
                const response = result.response;
                let jsonText = response.text().trim();

                // Strip any markdown code fences Gemini may still add despite instructions
                jsonText = jsonText
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/\s*```\s*$/i, "")
                    .trim();

                // If the response still has surrounding text, extract the first JSON object
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonText = jsonMatch[0];
                }

                const parsed = JSON.parse(jsonText);

                // Safety guard: ensure isComplete is only true when ALL required fields are actually present
                const d = parsed.extractedData || {};
                const hasAllFields = !!(d.name && d.category && d.price != null && d.unit && d.stock != null);
                if (!hasAllFields && parsed.isComplete) {
                    parsed.isComplete = false;
                    // Generate a fallback question if the AI forgot to set one
                    if (!parsed.nextQuestion) {
                        const priorityFields: { key: string; label: string }[] = [
                            { key: "name", label: "crop name" },
                            { key: "category", label: "category (grains, vegetables, fruits, pulses, or others)" },
                            { key: "price", label: "price per unit in Rupees" },
                            { key: "unit", label: "unit (kg, gram, quintal, dozen, litre, or piece)" },
                            { key: "stock", label: "stock quantity available" },
                        ];
                        const missingField = priorityFields.find(f => d[f.key] == null || d[f.key] === "");
                        parsed.nextQuestion = missingField
                            ? `Could you tell me the ${missingField.label} for your crop?`
                            : "Could you share the remaining details?";
                    }
                }

                return parsed;
            } catch (error: any) {
                console.error("Gemini API Error in extractCropInfo:", error);
                const msg = error.message || String(error);
                throw new Error(`I encountered an error while trying to process your request. Debug: ${msg}`);
            }
        }),
});