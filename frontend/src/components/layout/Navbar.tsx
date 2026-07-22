import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../context/LanguageContext';

export default function Navbar() {
  const location = useLocation();
  const t = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/analyze', label: t.nav.analyze },
    { to: '/dashboard', label: t.nav.dashboard },
    { to: '/about', label: t.nav.about },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-card border-b py-3'
          : 'bg-transparent py-5'
      )}
      style={scrolled ? { borderBottomColor: 'rgba(255,214,10,0.2)' } : {}}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary-gradient opacity-40 blur-md group-hover:opacity-70 transition-opacity duration-300" />
            <div className="relative w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow-yellow group-hover:shadow-glow-green transition-all duration-300">
              <Shield className="w-5 h-5 text-navy-950" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ai-status-dot text-emerald-400" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg gradient-text block leading-none tracking-tight">
              {t.common.brandLine1}
            </span>
            <span className="font-heading font-bold text-sm leading-none tracking-wide flex items-center gap-1.5" style={{ color: '#FFD60A' }}>
              {t.common.brandLine2}
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400/80 tracking-widest ml-1">
                {t.common.aiOnline}
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === link.to
                  ? 'border'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              style={location.pathname === link.to ? {
                background: 'rgba(255,214,10,0.12)',
                color: '#FFD60A',
                borderColor: 'rgba(255,214,10,0.35)',
              } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button + Language Switch */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-white/10"
            aria-label="Switch language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className={cn(language === 'en' ? 'text-white' : 'text-gray-500')}>English</span>
            <span className="text-gray-600">|</span>
            <span className={cn(language === 'hi' ? 'text-white' : 'text-gray-500')}>हिन्दी</span>
          </button>
          <Link
            to="/analyze"
            className="btn-cyber flex items-center gap-2 text-sm py-2 px-5"
          >
            <Zap className="w-4 h-4" />
            <span className="relative z-10">{t.common.scanNow}</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={t.common.toggleMenu}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card border-t overflow-hidden"
            style={{ borderTopColor: 'rgba(255,214,10,0.15)' }}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    location.pathname === link.to
                      ? ''
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                  style={location.pathname === link.to ? {
                    background: 'rgba(255,214,10,0.12)',
                    color: '#FFD60A',
                  } : {}}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-white/10"
                aria-label="Switch language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className={cn(language === 'en' ? 'text-white' : 'text-gray-500')}>English</span>
                <span className="text-gray-600">|</span>
                <span className={cn(language === 'hi' ? 'text-white' : 'text-gray-500')}>हिन्दी</span>
              </button>
              <Link to="/analyze" className="btn-cyber text-center text-sm py-3 mt-2">
                <span className="relative z-10">🔍 {t.common.scanNow}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
