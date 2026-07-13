import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import sanitizeHtml from "sanitize-html";

// Server-side initialization of Supabase client using Service Role to bypass potential RLS or anon restrictions when inserting on behalf of users,
// or we can verify the user's authorization header and use user-scoped client.
// Let's obtain the token from authorization header to identify the user correctly.
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Get Authorization Header for authenticating user
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized. Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Initialize user-scoped Supabase client to verify JWT and get user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aaavhqqyznrleytwxqkf.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    // We can verify user session
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      // Fallback check: See if this is a demo/mock user scenario
      // If we are in local development and auth is mocked, we might want to support it,
      // but let's check authError details.
      console.error("Auth error in API clip:", authError);
      return NextResponse.json({ error: "Unauthorized user session" }, { status: 401 });
    }

    // 2. Fetch the target URL's HTML with realistic headers
    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        return NextResponse.json({
          error: `Failed to fetch page. Server responded with status ${response.status}`
        }, { status: 422 });
      }

      html = await response.text();
    } catch (fetchErr: any) {
      console.error("Error fetching URL:", fetchErr);
      return NextResponse.json({
        error: "Could not fetch target page. The URL might be invalid or the server blocked our request."
      }, { status: 422 });
    }

    // 3. Parse with JSDOM and Readability
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Retrieve lead image from Open Graph or Twitter tags as fallback
    let leadImage = "";
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    const itemPropImage = document.querySelector('meta[itemprop="image"]');
    
    if (ogImage) {
      leadImage = ogImage.getAttribute("content") || "";
    } else if (twitterImage) {
      leadImage = twitterImage.getAttribute("content") || "";
    } else if (itemPropImage) {
      leadImage = itemPropImage.getAttribute("content") || "";
    }

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().split(/\s+/).filter(Boolean).length < 100) {
      return NextResponse.json({
        error: "Couldn't extract readable content from this page — it may be paywalled, JavaScript-rendered, or have too little text."
      }, { status: 422 });
    }

    // 4. Sanitize HTML
    // We allow standard safe tags for article readability
    const sanitizedContent = sanitizeHtml(article.content || "", {
      allowedTags: [
        "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
        "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
        "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img"
      ],
      allowedAttributes: {
        a: ["href", "name", "target"],
        img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
        "*": ["class", "id", "style"]
      },
      allowedSchemes: ["http", "https", "mailto", "tel"]
    });

    // 5. Extract domain and estimate reading time
    let domain = "";
    try {
      const parsedUrl = new URL(url);
      domain = parsedUrl.hostname.replace("www.", "");
    } catch (e) {
      domain = url;
    }

    const wordCount = article.textContent.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    // 6. Save or Update in database using admin client (Service Role) to write securely
    const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
      auth: { persistSession: false }
    });

    // Check if user already clipped this URL
    const { data: existingClip } = await supabaseAdmin
      .from("clipped_articles")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_url", url)
      .maybeSingle();

    let savedData;
    if (existingClip) {
      // Update in-place
      const { data, error: updateError } = await supabaseAdmin
        .from("clipped_articles")
        .update({
          title: article.title || "Untitled Article",
          author: article.byline || null,
          content: sanitizedContent,
          excerpt: article.excerpt || null,
          image_url: leadImage || null,
          domain,
          reading_time_minutes: readingTimeMinutes,
          created_at: new Date().toISOString() // update timestamp to sort to top
        })
        .eq("id", existingClip.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating clipped article:", updateError);
        return NextResponse.json({ error: "Failed to update clipped article" }, { status: 500 });
      }
      savedData = data;
    } else {
      // Insert new clip
      const { data, error: insertError } = await supabaseAdmin
        .from("clipped_articles")
        .insert({
          user_id: user.id,
          title: article.title || "Untitled Article",
          author: article.byline || null,
          content: sanitizedContent,
          excerpt: article.excerpt || null,
          image_url: leadImage || null,
          source_url: url,
          domain,
          reading_time_minutes: readingTimeMinutes
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting clipped article:", insertError);
        return NextResponse.json({ error: "Failed to save clipped article" }, { status: 500 });
      }
      savedData = data;
    }

    return NextResponse.json({
      success: true,
      id: savedData.id,
      title: article.title
    });

  } catch (err: any) {
    console.error("Clip API crash:", err);
    return NextResponse.json({ error: "Internal Server Error: " + err.message }, { status: 500 });
  }
}
