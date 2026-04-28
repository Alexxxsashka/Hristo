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

import { useSettingsStore } from '../store/settingsStore';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
  structuredData
}) => {
  const { settings } = useSettingsStore();
  
  const finalTitle = title || settings?.seoTitle || "Hristo Airsoft Store | Professional Equipment & 3D Configurator";
  const finalDescription = description || settings?.seoDescription || "Professional Airsoft Equipment & Customization. Experience the next generation of tactical gear building with our high-fidelity 3D configurator.";
  const finalKeywords = keywords || settings?.seoKeywords || "airsoft, tactical gear, airsoft guns, 3d configurator, airsoft croatia, hristo airsoft";
  const finalOgImage = ogImage || settings?.ogImage || settings?.logoUrl || "";
  
  const siteName = "Hristo Airsoft Store";
  const fullTitle = finalTitle.includes(siteName) ? finalTitle : `${finalTitle} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* OpenGraph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
