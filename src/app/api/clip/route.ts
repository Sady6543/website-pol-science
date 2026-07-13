import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

// Server-side initialization of Supabase client using Service Role to bypass potential RLS or anon restrictions when inserting on behalf of users.
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
    
    let user: { id: string } | null = null;

    if (token === "demo_session_token") {
      // Mock demo user context
      user = { id: "00000000-0000-0000-0000-000000000000" }; // use standard uuid or fallback
    } else {
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

      const { data: { user: supabaseUser }, error: authError } = await supabaseUserClient.auth.getUser();
      if (authError || !supabaseUser) {
        console.error("Auth error in API clip:", authError);
        return NextResponse.json({ error: "Unauthorized user session" }, { status: 401 });
      }
      user = supabaseUser;
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

    // 3. Parse with Cheerio (lightweight, runs perfectly in Vercel Serverless environment)
    const $ = cheerio.load(html);

    // Retrieve title
    const title = $("title").text().trim() || 
                  $('meta[property="og:title"]').attr("content") || 
                  $("h1").first().text().trim() || 
                  "Untitled Article";

    // Retrieve byline/author
    const author = $('meta[name="author"]').attr("content") || 
                   $('meta[property="article:author"]').attr("content") || 
                   $(".author, [class*='author'], .byline, [class*='byline']").first().text().trim() || 
                   null;

    // Retrieve lead image
    const leadImage = $('meta[property="og:image"]').attr("content") || 
                      $('meta[name="twitter:image"]').attr("content") || 
                      $('meta[itemprop="image"]').attr("content") || 
                      null;

    // Remove noise elements from body content to keep it clean (similar to Readability)
    $("nav, footer, header, script, style, noscript, iframe, link, svg, form, input, button, aside, .sidebar, [class*='sidebar'], .nav, .menu, [class*='menu'], .ads, [class*='ads'], .social-share, [class*='share'], .comments, [class*='comment']").remove();

    // Extract main article content or fallback to body content
    // We prioritize typical article containers
    let contentSelector = "article, .article, [class*='article-body'], .post, .entry-content, main, body";
    let contentHtml = "";
    let plainText = "";

    const selectors = ["article", ".article-body", "[class*='article-body']", ".entry-content", ".post-content", "main"];
    let mainContainer = null;
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length > 0 && el.text().trim().split(/\s+/).filter(Boolean).length > 120) {
        mainContainer = el;
        break;
      }
    }

    if (mainContainer) {
      contentHtml = mainContainer.html() || "";
      plainText = mainContainer.text();
    } else {
      contentHtml = $("body").html() || "";
      plainText = $("body").text();
    }

    // Excerpt extraction
    const excerpt = $('meta[name="description"]').attr("content") || 
                    $('meta[property="og:description"]').attr("content") || 
                    plainText.trim().substring(0, 180) + "...";

    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      return NextResponse.json({
        error: "Couldn't extract readable content from this page — it may be paywalled, JavaScript-rendered, or have too little text."
      }, { status: 422 });
    }

    // 4. Sanitize HTML
    const sanitizedContent = sanitizeHtml(contentHtml, {
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
          title,
          author: author ? author.substring(0, 100) : null,
          content: sanitizedContent,
          excerpt: excerpt ? excerpt.substring(0, 300) : null,
          image_url: leadImage,
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
          title,
          author: author ? author.substring(0, 100) : null,
          content: sanitizedContent,
          excerpt: excerpt ? excerpt.substring(0, 300) : null,
          image_url: leadImage,
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
      title
    });

  } catch (err: any) {
    console.error("Clip API crash:", err);
    return NextResponse.json({ error: "Internal Server Error: " + err.message }, { status: 500 });
  }
}
