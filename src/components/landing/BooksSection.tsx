import React from 'react';
import { ArrowRight, Book, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { featuredCollections, featuredAuthors } from '@/data/madarikData';
import { Link } from 'react-router-dom';

export const BooksSection = () => {
  const { t, language, direction } = useLanguage();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            {t('featuredBooksTitle')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald to-sandstone mx-auto rounded-full" />
        </div>

        {/* Featured Collections */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-charcoal mb-8 flex items-center">
            <Book className="w-6 h-6 mr-3 text-emerald" />
            المجموعات المميزة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCollections.map((collection) => (
              <Card key={collection.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-emerald/30">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-gradient-to-br from-muted to-card rounded-t-lg mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white text-sm font-medium">
                        {collection.bookCount} كتاب
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-gold" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-charcoal mb-2 group-hover:text-emerald transition-colors">
                      {collection.title[language]}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {collection.description[language]}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald hover:text-emerald hover:bg-emerald/10 p-0"
                    >
                      {t('viewBooks')}
                      <ArrowRight className={`w-4 h-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Authors */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-charcoal mb-8 flex items-center">
            <User className="w-6 h-6 mr-3 text-sandstone" />
            المؤلفون المميزون
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {featuredAuthors.map((author) => (
              <Card key={author.id} className="text-center group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-sandstone/30">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-sandstone to-emerald rounded-full mx-auto mb-3 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-gold text-charcoal text-xs px-2 py-1 rounded-full font-medium">
                      {author.bookCount}
                    </div>
                  </div>
                  <h4 className="font-semibold text-charcoal mb-2 group-hover:text-sandstone transition-colors">
                    {author.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {author.bio[language]}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sandstone hover:text-sandstone hover:bg-sandstone/10 text-xs"
                  >
                    {t('viewBooks')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/library">
            <Button 
              size="lg" 
              className="bg-emerald hover:bg-emerald/90 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {t('browseLibrary')}
              <ArrowRight className={`w-5 h-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};