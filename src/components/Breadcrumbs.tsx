import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { formatEnum } from '../utils/format';

interface BreadcrumbsProps {
  items?: { label: string; path: string }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation();
  
  // Generate breadcrumbs from path if not provided
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbItems = items || [
    { label: 'Home', path: '/' },
    ...pathnames.map((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      return {
        label: formatEnum(value),
        path,
      };
    }),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${window.location.origin}${item.path}`
    }))
  };

  return (
    <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight size={12} className="text-zinc-700 shrink-0" />}
          <Link 
            to={item.path}
            className={`hover:text-white transition-colors flex items-center gap-1 ${
              index === breadcrumbItems.length - 1 ? 'text-zinc-300' : ''
            }`}
          >
            {index === 0 && <Home size={12} />}
            {item.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};
