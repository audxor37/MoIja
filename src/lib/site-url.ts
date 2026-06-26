type SiteUrlInput = {
  configuredSiteUrl?: string;
  requestOrigin?: string;
  vercelProjectProductionUrl?: string;
};

const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function isPlaceholderUrl(value: string) {
  return value.includes("your-vercel-domain.vercel.app") || value.includes("your-domain.com");
}

export function resolveSiteUrl({
  configuredSiteUrl,
  requestOrigin,
  vercelProjectProductionUrl
}: SiteUrlInput) {
  const configured = normalizeUrl(configuredSiteUrl);

  if (configured && !isPlaceholderUrl(configured)) {
    return configured;
  }

  const request = normalizeUrl(requestOrigin);

  if (request) {
    return request;
  }

  const vercelProduction = normalizeUrl(vercelProjectProductionUrl);

  return vercelProduction || LOCAL_SITE_URL;
}
