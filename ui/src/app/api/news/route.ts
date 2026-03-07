import { NextResponse } from "next/server";

// ─── Types ───
interface NewsItem {
    id: string;
    title: string;
    summary: string;
    date: string;
    link: string;
    image: string;
    analysePrompt: string;
}

// ─── In-memory cache ───
let cachedNews: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms

// Fallback images for news items
const fallbackImages = [
    "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop",
];

// Parse basic XML without a library — extract content between tags
function extractTag(xml: string, tag: string): string {
    // Try CDATA first
    const cdataRegex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
}

function extractAllItems(xml: string): string[] {
    const items: string[] = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        items.push(match[1]);
    }
    return items;
}

function stripHtml(html: string): string {
    // Decode entities first so encoded tags become real tags
    const decoded = html
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");

    // Now strip the tags
    return decoded.replace(/<[^>]*>/g, "").trim();
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

async function fetchLegalNews(): Promise<NewsItem[]> {
    const queries = [
        "India+Supreme+Court+judgment",
        "India+High+Court+ruling",
        "India+legal+news+law",
    ];

    const allItems: NewsItem[] = [];

    for (const q of queries) {
        try {
            const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
            const res = await fetch(rssUrl, {
                headers: { "User-Agent": "YuktiAI/1.0" },
                signal: AbortSignal.timeout(8000),
            });

            if (!res.ok) continue;

            const xml = await res.text();
            const items = extractAllItems(xml);

            for (const item of items.slice(0, 4)) {
                const title = stripHtml(extractTag(item, "title"));
                const description = stripHtml(extractTag(item, "description"));
                const pubDate = extractTag(item, "pubDate");
                const link = extractTag(item, "link");

                if (!title) continue;

                // Avoid duplicates by title
                if (allItems.some((n) => n.title === title)) continue;

                const summary = description.length > 300
                    ? description.slice(0, 297) + "..."
                    : description || title;

                allItems.push({
                    id: `news-${Date.now()}-${allItems.length}`,
                    title,
                    summary,
                    date: formatDate(pubDate),
                    link,
                    image: fallbackImages[allItems.length % fallbackImages.length],
                    analysePrompt: `${title}\n\n${summary}\n\nAnalyse the legal implications of this development. What are the key legal principles involved and how does this impact Indian jurisprudence?`,
                });
            }
        } catch {
            // Silently skip failed queries
            continue;
        }
    }

    // Sort by Date descending (most recent first)
    allItems.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Return up to 6 items, sorted by most recent
    return allItems.slice(0, 6);
}

// ─── Static fallback news (used if RSS fetch fails) ───
const staticFallbackNews: NewsItem[] = [
    {
        id: "static-1",
        title: "Madras High Court directs MS Dhoni to deposit ₹10 lakh in defamation case",
        summary: "In a defamation suit filed by MS Dhoni over IPL fixing allegations, the Madras High Court directed him to deposit ₹10 lakh. The amount is not a penalty, but intended to cover transcription and translation of audio-video evidence required for trial.",
        date: "February 20, 2026",
        link: "#",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=500&fit=crop",
        analysePrompt: "In a defamation suit filed by MS Dhoni over IPL fixing allegations, the Madras High Court directed him to deposit ₹10 lakh.\nWho should bear the cost of processing evidence in such cases — the plaintiff, defendant, or the court?",
    },
    {
        id: "static-2",
        title: "Supreme Court clarifies guidelines on bail for economic offences",
        summary: "The Supreme Court of India laid down fresh guidelines distinguishing between economic offences and regular criminal cases for the purpose of bail, emphasizing that blanket denial of bail in economic offences violates fundamental rights under Article 21.",
        date: "February 18, 2026",
        link: "#",
        image: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=400&h=500&fit=crop",
        analysePrompt: "The Supreme Court of India laid down fresh guidelines for bail in economic offences.\nAnalyse the legal precedents on bail in economic offences. How does Article 21 interact with denial of bail?",
    },
    {
        id: "static-3",
        title: "Delhi HC issues landmark ruling on tenants' rights during redevelopment",
        summary: "The Delhi High Court ruled that tenants cannot be evicted during building redevelopment without providing adequate alternative accommodation or compensation, strengthening tenant protections under the Delhi Rent Control Act.",
        date: "February 15, 2026",
        link: "#",
        image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=500&fit=crop",
        analysePrompt: "The Delhi High Court ruled that tenants cannot be evicted during building redevelopment without providing adequate alternative accommodation.\nWhat are the current tenant protection mechanisms under the Delhi Rent Control Act?",
    },
    {
        id: "static-4",
        title: "NCLAT upholds CCI penalty on tech giant for anti-competitive practices",
        summary: "The National Company Law Appellate Tribunal upheld a ₹1,337 crore penalty imposed by the Competition Commission of India on a major tech company for abusing its dominant position in the smartphone ecosystem market.",
        date: "February 12, 2026",
        link: "#",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=500&fit=crop",
        analysePrompt: "NCLAT upheld a ₹1,337 crore penalty imposed by CCI on a major tech company for abusing its dominant position.\nWhat constitutes 'abuse of dominant position' under the Competition Act, 2002?",
    },
];

export async function GET() {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedNews.length > 0 && now - lastFetchTime < CACHE_DURATION) {
        return NextResponse.json({
            news: cachedNews,
            source: "cache",
            lastUpdated: new Date(lastFetchTime).toISOString(),
            nextUpdate: new Date(lastFetchTime + CACHE_DURATION).toISOString(),
        });
    }

    // Fetch fresh news
    try {
        const freshNews = await fetchLegalNews();

        if (freshNews.length > 0) {
            cachedNews = freshNews;
            lastFetchTime = now;

            return NextResponse.json({
                news: cachedNews,
                source: "live",
                lastUpdated: new Date(now).toISOString(),
                nextUpdate: new Date(now + CACHE_DURATION).toISOString(),
            });
        }
    } catch {
        // Fall through to static fallback
    }

    // If live fetch failed but we have old cache, use it
    if (cachedNews.length > 0) {
        return NextResponse.json({
            news: cachedNews,
            source: "stale-cache",
            lastUpdated: new Date(lastFetchTime).toISOString(),
            nextUpdate: new Date(now).toISOString(),
        });
    }

    // Ultimate fallback: static data
    return NextResponse.json({
        news: staticFallbackNews,
        source: "static",
        lastUpdated: new Date(now).toISOString(),
        nextUpdate: new Date(now + CACHE_DURATION).toISOString(),
    });
}
