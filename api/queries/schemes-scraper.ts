import * as cheerio from "cheerio";
import { getDb } from "./connection";
import { schemes } from "@db/schema";
import { eq } from "drizzle-orm";

export async function runScraper() {
    try {
        console.log("Starting government schemes scraper...");
        // Since many actual portals have anti-scraping or complex dynamic rendering,
        // we'll mock a fetch to an HTML payload for demonstration purposes.
        const mockHtml = `
            <div class="scheme-list">
                <div class="scheme-item">
                    <h2 class="title">PM-KISAN Samman Nidhi (Update 2026)</h2>
                    <p class="desc">Income support of Rs.6000/- per year in three equal installments.</p>
                    <span class="category">financial</span>
                    <span class="benefit">₹6,000/year</span>
                    <span class="eligibility">Small and marginal farmers</span>
                    <span class="deadline">2026-12-31</span>
                    <a class="link" href="https://pmkisan.gov.in/">Apply Now</a>
                </div>
                <div class="scheme-item">
                    <h2 class="title">National Agriculture Market (e-NAM) Expansion</h2>
                    <p class="desc">Pan-India electronic trading portal which networks the existing APMC mandis.</p>
                    <span class="category">training</span>
                    <span class="benefit">Market Access</span>
                    <span class="eligibility">All Farmers</span>
                    <span class="deadline">2027-03-31</span>
                    <a class="link" href="https://enam.gov.in/">Apply Now</a>
                </div>
                <div class="scheme-item">
                    <h2 class="title">Pradhan Mantri Fasal Bima Yojana (PMFBY) 2.0</h2>
                    <p class="desc">Comprehensive crop insurance coverage from pre-sowing to post-harvest losses.</p>
                    <span class="category">insurance</span>
                    <span class="benefit">Crop Insurance</span>
                    <span class="eligibility">All farmers growing notified crops</span>
                    <span class="deadline">2026-08-15</span>
                    <a class="link" href="https://pmfby.gov.in/">Apply Now</a>
                </div>
            </div>
        `;
        
        const $ = cheerio.load(mockHtml);
        const db = getDb();
        
        const items = $(".scheme-item");
        let added = 0;
        
        for (const el of items) {
            const title = $(el).find(".title").text().trim();
            const description = $(el).find(".desc").text().trim();
            const categoryText = $(el).find(".category").text().trim() as any;
            const benefit = $(el).find(".benefit").text().trim();
            const eligibility = $(el).find(".eligibility").text().trim();
            const deadline = $(el).find(".deadline").text().trim();
            const applicationLink = $(el).find(".link").attr("href") || "";
            
            // Check if exists
            const existing = await db.select().from(schemes).where(eq(schemes.title, title)).limit(1);
            if (existing.length === 0) {
                await db.insert(schemes).values({
                    title,
                    description,
                    category: ["financial", "equipment", "insurance", "training", "subsidy"].includes(categoryText) ? categoryText : "financial",
                    benefit,
                    eligibility,
                    deadline: deadline ? new Date(deadline) : null,
                    documentRequired: "Aadhar, Land Records",
                    applicationLink,
                    image: "/scheme-pmkisan.jpg",
                    isNew: true,
                    color: "#1B5E20",
                    isActive: true,
                });
                added++;
            }
        }
        
        console.log(`Scraper finished. Added ${added} new schemes.`);
        return { success: true, added };
    } catch (e) {
        console.error("Scraper failed:", e);
        return { success: false, error: String(e) };
    }
}
