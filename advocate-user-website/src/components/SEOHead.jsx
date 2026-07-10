import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://ashritha-d.github.io/ChauhanAdvocate';
const DEFAULT_IMAGE = `${SITE_URL}/adv-photo.jpeg`;
const SITE_NAME = 'Advocate Chauhan – Balu Law Chamber';

export default function SEOHead({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  noindex = false,
  type = 'website',
  children,
}) {
  const fullTitle = title ? `${title} | Advocate Chauhan` : 'Advocate Chauhan – Expert Legal Services in Hyderabad';
  const pageUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {children}
    </Helmet>
  );
}
