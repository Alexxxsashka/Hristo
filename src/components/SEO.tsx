import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonicalUrl?: string;
  structuredData?: any;
}

export const SEO: React.FC<SEOProps> = ({
  title = "Hristo Airsoft Store | Professional Equipment & 3D Configurator",
  description = "Professional Airsoft Equipment & Customization. Experience the next generation of tactical gear building with our high-fidelity 3D configurator.",
  keywords = "airsoft, tactical gear, airsoft guns, 3d configurator, airsoft croatia, hristo airsoft",
  ogImage = "https://picsum.photos/seed/hristo-og/1200/630",
  ogType = "website",
  canonicalUrl,
  structuredData
}) => {
  const siteName = "Hristo Airsoft Store";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OpenGraph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
