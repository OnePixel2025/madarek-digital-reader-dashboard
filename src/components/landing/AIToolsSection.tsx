import React from 'react';
import { MessageCircle, FileText, Headphones, Brain, Search, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { aiTools } from '@/data/madarikData';

const iconMap = {
  MessageCircle,
  FileText,
  Headphones,
  Brain,
  Search,
};

export const AIToolsSection = () => {
  const { t, language, direction } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-br from-emerald/5 via-background to-sandstone/5">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald to-sandstone rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            {t('aiToolsTitle')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald to-sandstone mx-auto rounded-full" />
        </div>

        {/* AI Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {aiTools.map((tool, index) => {
            const IconComponent = iconMap[tool.icon as keyof typeof iconMap];
            return (
              <Card 
                key={tool.id} 
                className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-emerald/30 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald/10 to-sandstone/10 rounded-xl flex items-center justify-center group-hover:from-emerald/20 group-hover:to-sandstone/20 transition-all duration-300">
                        <IconComponent className="w-6 h-6 text-emerald group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal mb-3 group-hover:text-emerald transition-colors">
                        {tool.title[language]}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {tool.description[language]}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald/5 to-sandstone/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="https://app.madarik.com" target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald to-sandstone hover:from-emerald/90 hover:to-sandstone/90 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              {t('tryAITools')}
              <ArrowRight className={`w-5 h-5 ${direction === 'rtl' ? 'mr-3 rotate-180' : 'ml-3'} group-hover:translate-x-1 transition-transform duration-300`} />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};