import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const defaultSEO = {
  siteName: "FanHub",
  title: "FanHub - Connect with Passionate Fans Worldwide",
  description: "Join FanHub, the global community platform for fans of anime, movies, games, comics, and more. Share discussions, connect with like-minded people, and be part of something bigger.",
  keywords: "fan community, anime fans, movie discussions, gaming community, fan forums, online community, fandom, geek culture, pop culture, entertainment community",
  image: "https://lovable.dev/opengraph-image-p98pqg.png",
  url: "https://wpczgwxsriezaubncuom.lovable.app",
};

export function SEO({ 
  title, 
  description, 
  keywords,
  image,
  type = "website" 
}: SEOProps) {
  const location = useLocation();
  
  const pageTitle = title 
    ? `${title} | ${defaultSEO.siteName}` 
    : defaultSEO.title;
  const pageDescription = description || defaultSEO.description;
  const pageKeywords = keywords || defaultSEO.keywords;
  const pageImage = image || defaultSEO.image;
  const pageUrl = `${defaultSEO.url}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        element.setAttribute("content", content);
        document.head.appendChild(element);
      }
    };

    // Standard meta tags
    updateMetaTag("description", pageDescription);
    updateMetaTag("keywords", pageKeywords);
    
    // Open Graph tags
    updateMetaTag("og:title", pageTitle, true);
    updateMetaTag("og:description", pageDescription, true);
    updateMetaTag("og:image", pageImage, true);
    updateMetaTag("og:url", pageUrl, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:site_name", defaultSEO.siteName, true);
    
    // Twitter tags
    updateMetaTag("twitter:title", pageTitle);
    updateMetaTag("twitter:description", pageDescription);
    updateMetaTag("twitter:image", pageImage);
    updateMetaTag("twitter:url", pageUrl);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", pageUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", pageUrl);
      document.head.appendChild(canonical);
    }

    // Structured Data (JSON-LD) for WebSite
    let jsonLd = document.querySelector('script[type="application/ld+json"]#seo-jsonld');
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.setAttribute("type", "application/ld+json");
      jsonLd.setAttribute("id", "seo-jsonld");
      document.head.appendChild(jsonLd);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${defaultSEO.url}/#website`,
          "url": defaultSEO.url,
          "name": defaultSEO.siteName,
          "description": defaultSEO.description,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${defaultSEO.url}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": `${defaultSEO.url}/#organization`,
          "name": defaultSEO.siteName,
          "url": defaultSEO.url,
          "logo": {
            "@type": "ImageObject",
            "url": pageImage
          },
          "sameAs": []
        },
        {
          "@type": "WebPage",
          "@id": `${pageUrl}#webpage`,
          "url": pageUrl,
          "name": pageTitle,
          "description": pageDescription,
          "isPartOf": { "@id": `${defaultSEO.url}/#website` },
          "about": { "@id": `${defaultSEO.url}/#organization` }
        }
      ]
    };

    jsonLd.textContent = JSON.stringify(structuredData);

    return () => {
      // Cleanup is optional since we're updating rather than removing
    };
  }, [pageTitle, pageDescription, pageKeywords, pageImage, pageUrl, type]);

  return null;
}
