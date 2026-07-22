import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, GitBranch, X, Heart } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function Footer() {
  const t = useTranslation();

  const quickLinks = [
    { to: '/', label: t.footer.quickLinks.home },
    { to: '/analyze', label: t.footer.quickLinks.analyze },
    { to: '/dashboard', label: t.footer.quickLinks.dashboard },
    { to: '/about', label: t.footer.quickLinks.about },
  ];

  return (
    <footer className="relative border-t bg-navy-950/80 backdrop-blur-sm" style={{ borderTopColor: 'rgba(255,214,10,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center">
                <Shield className="w-4 h-4 text-navy-950" />
              </div>
              <span className="font-heading font-bold text-lg gradient-text">{t.common.brandLine1} {t.common.brandLine2}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 glass-card rounded-lg flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-colors" style={{ '--tw-text-opacity': '1' } as React.CSSProperties}>
                <X className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 glass-card rounded-lg flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-colors">
                <GitBranch className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">{t.footer.quickLinksHeading}</h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">{t.footer.resourcesHeading}</h4>
            <ul className="space-y-2">
              {t.footer.resources.map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            {t.footer.copyright}
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            {t.footer.madeWith} <Heart className="w-3 h-3 text-red-400 fill-red-400" /> {t.footer.madeWithSuffix}
          </p>
        </div>
      </div>
    </footer>
  );
}
