

// ─── API CONFIG ---
const API_KEY = "cc2410eca89d448bbd62deb4df4ba29f";
const BASE_URL = "https://newsapi.org/v2/top-headlines";

// NewsAPI free plan blocks direct browser requests (CORS).
// We use allorigins.win as a server-side proxy.
// Each category uses only params that NewsAPI accepts cleanly.
const CATEGORY_MAP = {
  general:       { category: "general",       country: "us" },
  world:         { category: "general",       country: "us", q: "world" },
  business:      { category: "business",      country: "us" },
  technology:    { category: "technology",    country: "us" },
  sports:        { category: "sports",        country: "us" },
  health:        { category: "health",        country: "us" },
  entertainment: { category: "entertainment", country: "us" },
};


let allArticles = []; // full list from last fetch
let activeCategory = "general";
let searchQuery = "";

// ─── DOM REFERENCES (getElementById / querySelector use kiya)
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const retryBtn = document.getElementById("retryBtn");
const heroSection = document.getElementById("heroSection");
const newsGrid = document.getElementById("newsGrid");
const trendingList = document.getElementById("trendingList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const navList = document.getElementById("navList");
const noResults = document.getElementById("noResults");
const gridTitle = document.getElementById("gridTitle");
const footerYear = document.getElementById("footerYear");
const currentDate = document.getElementById("currentDate");

// ─── UTILITY: FALLBACK IMAGE 
const FALLBACK_IMG =
  "https://placehold.co/600x400/f3f1ee/888888?text=The+Bulletin+Times";

const safeImg = (url) => url || FALLBACK_IMG;

// ─── UTILITY: FORMAT DATE
const formatDate = (iso) => {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── UTILITY: TRUNCATE TEXT
const truncate = (text, max) =>
  text && text.length > max ? text.slice(0, max) + "…" : text || "";

// ─── SET CURRENT DATE  (date-banner)
const setHeaderDate = () => {
  const now = new Date();
  currentDate.innerText = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

footerYear.innerText = new Date().getFullYear();
setHeaderDate();

// ─── SHOW / HIDE SPINNER-
const showSpinner = () => {
  loadingSpinner.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  heroSection.innerHTML = "";
  newsGrid.innerHTML = "";
  trendingList.innerHTML = "";
};

const hideSpinner = () => loadingSpinner.classList.add("hidden");

// ─── SHOW ERROR 
const showError = (msg) => {
  hideSpinner();
  errorText.innerText = msg;
  errorMessage.classList.remove("hidden");
};

// ─── BUILD NEWS API URL
// CHANGED: Removed AllOrigins proxy wrapper. Now returns the direct NewsAPI URL.
const buildURL = (category) => {
  const config = CATEGORY_MAP[category] || CATEGORY_MAP.general;
  const params = new URLSearchParams({ apiKey: API_KEY, pageSize: 20 });
  if (config.category) params.set("category", config.category);
  if (config.country)  params.set("country",  config.country);
  if (config.q)        params.set("q",         config.q);
  // CHANGED: Return direct NewsAPI URL instead of wrapping with AllOrigins proxy
  return `${BASE_URL}?${params.toString()}`;
};

// ─── FETCH WITH TIMEOUT HELPER
// Wraps fetch() with a timeout so hanging requests fail fast
const fetchWithTimeout = (url, ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// ─── MOCK DATA (shown when API key is placeholder / fails) ───────────────────
const MOCK_ARTICLES = [
  {
    title: "India's Space Mission Marks Historic Milestone with Lunar Landing",
    description:
      "ISRO's latest lunar probe successfully touched down near the Moon's south pole, making India only the fourth country to achieve a soft landing on the Moon.",
    urlToImage: "https://placehold.co/600x400/c8dce8/333333?text=Space+Mission",
    publishedAt: new Date().toISOString(),
    source: { name: "Space Today" },
    url: "#",
    category: "Technology",
  },
  {
    title: "Global Economy Shows Signs of Recovery as Markets Rally",
    description:
      "Stock markets across Asia and Europe surged following positive data from major economies, suggesting a broad-based recovery is underway.",
    urlToImage: "https://placehold.co/600x400/d6e8d0/333333?text=Markets+Rally",
    publishedAt: new Date().toISOString(),
    source: { name: "Business Herald" },
    url: "#",
    category: "Business",
  },
  {
    title: "Breakthrough in AI Research Could Transform Healthcare",
    description:
      "Scientists have developed a new AI model capable of diagnosing rare genetic disorders from a single blood test with over 95% accuracy.",
    urlToImage: "https://placehold.co/600x400/e8dcc8/333333?text=AI+Healthcare",
    publishedAt: new Date().toISOString(),
    source: { name: "Tech Insider" },
    url: "#",
    category: "Technology",
  },
  {
    title: "Cricket: Team India Wins Series with Stunning Final Over Finish",
    description:
      "In a nail-biting finale, India chased down 320 in the last over to claim the series 3-2 against Australia at the Wankhede Stadium.",
    urlToImage: "https://placehold.co/600x400/f5dada/333333?text=Cricket+Win",
    publishedAt: new Date().toISOString(),
    source: { name: "Sports Daily" },
    url: "#",
    category: "Sports",
  },
  {
    title: "New Study Links Mediterranean Diet to Reduced Risk of Alzheimer's",
    description:
      "Researchers at Harvard found that individuals who closely follow a Mediterranean diet have a 35% lower risk of developing Alzheimer's disease.",
    urlToImage: "https://placehold.co/600x400/d8ead8/333333?text=Health+Study",
    publishedAt: new Date().toISOString(),
    source: { name: "Health Weekly" },
    url: "#",
    category: "Health",
  },
  {
    title: "Bollywood Blockbuster Shatters Opening Weekend Box Office Records",
    description:
      "The much-anticipated sequel crossed ₹500 crore in its opening weekend globally, making it the biggest debut in Indian cinema history.",
    urlToImage: "https://placehold.co/600x400/ead8e8/333333?text=Box+Office",
    publishedAt: new Date().toISOString(),
    source: { name: "Entertainment News" },
    url: "#",
    category: "Entertainment",
  },
  {
    title: "Climate Summit Reaches Historic Agreement on Carbon Emissions",
    description:
      "Leaders from 190 nations signed a landmark agreement pledging to cut carbon emissions by 50% before 2035, in what experts call a turning point.",
    urlToImage:
      "https://placehold.co/600x400/d0e8e0/333333?text=Climate+Summit",
    publishedAt: new Date().toISOString(),
    source: { name: "World Report" },
    url: "#",
    category: "World",
  },
  {
    title: "Parliament Passes Digital Personal Data Protection Bill",
    description:
      "The new legislation sets strict rules for how tech companies handle personal data of Indian citizens, imposing fines of up to ₹250 crore for violations.",
    urlToImage: "https://placehold.co/600x400/e8e0c8/333333?text=Data+Law",
    publishedAt: new Date().toISOString(),
    source: { name: "The National" },
    url: "#",
    category: "India",
  },
  {
    title: "Startup Raises $200M to Build India's Fastest Electric Bike",
    description:
      "Bengaluru-based EV startup secured a massive Series C round to launch a 0-100 kmph in 3.5-second electric motorcycle aimed at premium buyers.",
    urlToImage: "https://placehold.co/600x400/dce4f0/333333?text=EV+Startup",
    publishedAt: new Date().toISOString(),
    source: { name: "Startup India" },
    url: "#",
    category: "Business",
  },
  {
    title: "Monsoon Arrives Early, Forecasters Predict Above Normal Rainfall",
    description:
      "The IMD has forecast an above-normal monsoon season with widespread rains expected across 75% of India, boosting agricultural prospects.",
    urlToImage: "https://placehold.co/600x400/cce0f0/333333?text=Monsoon",
    publishedAt: new Date().toISOString(),
    source: { name: "Weather Watch" },
    url: "#",
    category: "India",
  },
  {
    title: "Tech Giants Announce Partnership to Build Open-Source AI Platform",
    description:
      "Google, Meta, and Microsoft announced a joint initiative to release a foundational AI model under an open-source license by year end.",
    urlToImage: "https://placehold.co/600x400/e8e8d8/333333?text=AI+Alliance",
    publishedAt: new Date().toISOString(),
    source: { name: "Tech Tribune" },
    url: "#",
    category: "Technology",
  },
  {
    title: "Women's Football League Announces Expansion to 16 Cities",
    description:
      "AIFF unveiled a major expansion of the Women's Super League, adding 8 new franchises from tier-2 cities to promote grassroots talent.",
    urlToImage:
      "https://placehold.co/600x400/f0dcd8/333333?text=Women+Football",
    publishedAt: new Date().toISOString(),
    source: { name: "Sports Hub" },
    url: "#",
    category: "Sports",
  },
];

// ─── FETCH NEWS 
const fetchNews = async (category = "general") => {
  showSpinner();
  activeCategory = category;
  searchQuery = "";
  searchInput.value = "";

  try {
    const url      = buildURL(category);
    const response = await fetchWithTimeout(url, 8000);

    // CHANGED: Check HTTP status directly from NewsAPI (no proxy layer)
    if (!response.ok) {
      throw new Error(`NewsAPI error: HTTP ${response.status}`);
    }

    // CHANGED: Parse JSON directly from the NewsAPI response (removed proxy .contents unwrapping)
    const data = await response.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "NewsAPI returned an error.");
    }

    const { articles } = data;

    const clean = articles.filter(
      (a) => a.title && !a.title.includes("[Removed]") && a.title !== "null"
    );

    if (clean.length === 0) {
      throw new Error("No articles found for this category.");
    }

    // ── SUCCESS: real live data ──
    allArticles = clean;
    hideFallbackBanner();
    renderAll(allArticles);

  } catch (err) {
    // CHANGED: Updated error log to reflect direct API failure (not proxy failure)
    console.error(
      "Live news fetch failed. Reason:", err.message,
      "\nPossible causes: CORS restriction on NewsAPI free plan (browser requests blocked), " +
      "invalid or expired API key, network error, or rate limit exceeded. " +
      "Falling back to MOCK_ARTICLES."
    );

    // Show error banner — tell user exactly what happened
    showFallbackBanner(
      "Could not load live news: " + err.message + ". Showing sample articles."
    );

    // Only use mock data if there is nothing else to show
    // (prevents mock from silently replacing real data on category switch)
    if (allArticles.length === 0) {
      allArticles = MOCK_ARTICLES;
      renderAll(allArticles);
    }
    // If allArticles already has real articles from a previous category,
    // keep those visible instead of overwriting with mock data

  } finally {
    hideSpinner();
  }
};

// ─── FALLBACK BANNER  (tells user live news failed — shown on error, hidden on success)
const showFallbackBanner = (message) => {
  let banner = document.getElementById("fallbackBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "fallbackBanner";
    banner.style.cssText =
      "background:#fff3cd;border-left:4px solid #ffc107;padding:10px 18px;" +
      "font-size:0.82rem;color:#856404;max-width:1200px;margin:0 auto;" +
      "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;";
    const main = document.querySelector(".main-content");
    if (main) main.insertAdjacentElement("beforebegin", banner);
  }
  banner.innerHTML =
    "<span>" + (message || "Live news unavailable — showing sample articles.") + "</span>" +
    "<button onclick=\"fetchNews(activeCategory)\" " +
    "style=\"background:#ffc107;border:none;padding:4px 14px;border-radius:4px;" +
    "font-size:0.8rem;font-weight:700;cursor:pointer;flex-shrink:0;\">Retry</button>";
  banner.style.display = "flex";
};

const hideFallbackBanner = () => {
  const banner = document.getElementById("fallbackBanner");
  if (banner) banner.style.display = "none";
};

// ─── RENDER ALL SECTIONS 
const renderAll = (articles) => {
  if (!articles || articles.length === 0) {
    heroSection.innerHTML = "";
    newsGrid.innerHTML = "";
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  const [hero, ...rest] = articles; // destructuring
  renderHero(hero);
  renderGrid(rest.slice(0, 11)); // up to 11 cards
  renderTrending(articles.slice(0, 5));
};

// ─── RENDER HERO ─────────────────────────────────────────────────────────────
const renderHero = (article) => {
  const { title, description, urlToImage, publishedAt, source, url } = article;

  heroSection.innerHTML = `
    <div class="hero-image-wrap">
      <img
        src="${safeImg(urlToImage)}"
        alt="${title}"
        onerror="this.src='${FALLBACK_IMG}'"
        loading="eager"
      />
      <span class="hero-badge">Featured</span>
    </div>
    <div class="hero-body">
      <span class="hero-category">${source?.name || "The Bulletin Times"}</span>
      <h1 class="hero-title">${title}</h1>
      <p class="hero-desc">${truncate(description, 200)}</p>
      <div class="hero-meta">
        <span>${formatDate(publishedAt)}</span>
        <span>${source?.name || "Unknown"}</span>
      </div>
      <a href="${url || "#"}" target="_blank" rel="noopener" class="read-more-btn">
        Read Full Story
      </a>
    </div>
  `;
};

// ─── CREATE CARD ELEMENT
const createCard = (article) => {
  const { title, description, urlToImage, publishedAt, source, url } = article;

  // createElement
  const card = document.createElement("article");
  card.classList.add("news-card");

  // innerHTML with template literal
  card.innerHTML = `
    <div class="card-img-wrap">
      <img
        src="${safeImg(urlToImage)}"
        alt="${title}"
        loading="lazy"
        onerror="this.src='${FALLBACK_IMG}'"
      />
      <span class="card-category-badge">${source?.name || "News"}</span>
    </div>
    <div class="card-body">
      <h2 class="card-title">${truncate(title, 100)}</h2>
      <p class="card-desc">${truncate(description, 120)}</p>
      <div class="card-footer">
        <span class="card-date">${formatDate(publishedAt)}</span>
        <a href="${url || "#"}" target="_blank" rel="noopener" class="card-read-more">
          Read more
        </a>
      </div>
    </div>
  `;

  return card;
};

// ─── RENDER GRID 
const renderGrid = (articles) => {
  newsGrid.innerHTML = "";

  if (articles.length === 0) {
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  // forEach + appendChild
  articles.forEach((article) => {
    const card = createCard(article);
    newsGrid.appendChild(card); // appendChild
  });
};

// ─── RENDER TRENDING SIDEBAR 
const renderTrending = (articles) => {
  trendingList.innerHTML = "";

  articles.forEach((article, index) => {
    const li = document.createElement("li");
    li.classList.add("trending-item");

    li.innerHTML = `
      <span class="trending-num">${String(index + 1).padStart(2, "0")}</span>
      <span class="trending-text">${truncate(article.title, 90)}</span>
    `;

    // click event via addEventListener
    li.addEventListener("click", () => {
      const target = article.url || "#";
      window.open(target, "_blank", "noopener");
    });

    trendingList.appendChild(li);
  });
};

// ─── SEARCH 
const performSearch = () => {
  searchQuery = searchInput.value.trim().toLowerCase();

  if (!searchQuery) {
    renderAll(allArticles);
    gridTitle.innerText = "Latest News";
    return;
  }

  // filter + includes (Array methods)
  const results = allArticles.filter((article) => {
    const haystack = `${article.title} ${article.description}`.toLowerCase();
    return haystack.includes(searchQuery);
  });

  gridTitle.innerText = `Search: "${searchInput.value.trim()}"`;

  // find the best match for hero
  const heroMatch = results.find((a) => a.urlToImage) || results[0];

  if (heroMatch) renderHero(heroMatch);

  const gridArticles = results.filter((a) => a !== heroMatch);
  renderGrid(gridArticles);

  if (results.length === 0) {
    noResults.classList.remove("hidden");
    heroSection.innerHTML = "";
  }
};

// ─── EVENTS

// Search button click event
searchBtn.addEventListener("click", performSearch);

// Search input keypress (input event)
searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    renderAll(allArticles);
    gridTitle.innerText = "Latest News";
  }
});

// Also allow Enter key
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") performSearch();
});

// Nav category buttons – querySelectorAll + forEach
const navBtns = document.querySelectorAll(".nav-btn");

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active from all, add to clicked
    navBtns.forEach((b) => b.classList.remove("active")); // classList
    btn.classList.add("active");

    const category = btn.dataset.category;
    gridTitle.innerText =
      btn.innerText.replace(/[^\w\s]/g, "").trim() + " News";
    fetchNews(category);
  });
});

// Retry button
retryBtn.addEventListener("click", () => {
  errorMessage.classList.add("hidden");
  fetchNews(activeCategory);
});

// Newsletter subscribe button (simple feedback)
const newsletterBtn = document.querySelector(".newsletter-btn");
const newsletterInput = document.querySelector(".newsletter-input");

newsletterBtn.addEventListener("click", () => {
  const email = newsletterInput.value.trim();
  if (!email || !email.includes("@")) {
    newsletterInput.style.borderColor = "var(--red)";
    newsletterInput.placeholder = "Enter a valid email";
    return;
  }
  newsletterInput.style.borderColor = "green";
  newsletterBtn.innerText = "Subscribed!";
  newsletterInput.value = "";
  newsletterInput.placeholder = "Enter your email";
  setTimeout(() => {
    newsletterBtn.innerText = "Subscribe";
    newsletterInput.style.borderColor = "";
  }, 3000);
});

// ─── INITIAL LOAD 
fetchNews("general");
