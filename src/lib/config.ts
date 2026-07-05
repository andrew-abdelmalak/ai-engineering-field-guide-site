export const GITHUB_OWNER = "alexeygrigorev";
export const GITHUB_REPO = "ai-engineering-field-guide";
export const GITHUB_BRANCH = "main";

export const REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

// How long fetched GitHub content stays cached before Next.js revalidates it
// in the background (ISR). Instant updates also arrive via /api/revalidate,
// which a GitHub webhook can call on every push.
export const CONTENT_REVALIDATE_SECONDS = 3600;
export const DIRECTORY_REVALIDATE_SECONDS = 1800;
