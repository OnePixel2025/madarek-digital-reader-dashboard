import React from 'react';
import { Search, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-offwhite to-muted" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-sandstone/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald/10 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gold/20 rounded-full blur-lg" />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Brand Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald to-sandstone rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-charcoal" />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-charcoal mb-6 leading-tight">
            {t('heroHeadline')}
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('heroSubheadline')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-border focus:border-emerald rounded-2xl bg-card shadow-lg"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/library">
              <Button size="lg" className="bg-emerald hover:bg-emerald/90 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <BookOpen className="w-5 h-5 mr-2" />
                {t('exploreBooks')}
              </Button>
            </Link>
            <a href="https://app.madarik.com" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-sandstone hover:bg-sandstone/90 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('tryAI')}
              </Button>
            </a>
          </div>

          {/* Partners Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-card border border-border rounded-full shadow-md">
            <span className="text-sm text-muted-foreground">
              {t('partnersText')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};