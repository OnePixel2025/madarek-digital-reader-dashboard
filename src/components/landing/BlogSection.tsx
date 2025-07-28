import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { blogPosts } from '@/data/madarikData';
import { Link } from 'react-router-dom';

export const BlogSection = () => {
  const { t, language, direction } = useLanguage();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            {t('blogTitle')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald to-sandstone mx-auto rounded-full" />
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-emerald/30 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                {/* Featured Image */}
                <div className="relative h-48 bg-gradient-to-br from-emerald/10 to-sandstone/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent opacity-60" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-charcoal">
                      جديد
                    </div>
                  </div>
                  <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-emerald/20 to-sandstone/20" />
                </div>

                <div className="p-6">
                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-charcoal mb-3 line-clamp-2 group-hover:text-emerald transition-colors duration-300">
                    {post.title[language]}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt[language]}
                  </p>

                  {/* Read More Button */}
                  <Button 
                    variant="ghost" 
                    className="text-emerald hover:text-emerald hover:bg-emerald/10 p-0 group/btn"
                  >
                    <span className="mr-2">{t('readMore')}</span>
                    <ArrowRight className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''} group-hover/btn:translate-x-1 transition-transform duration-300`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/blog">
            <Button 
              variant="outline"
              size="lg" 
              className="border-emerald text-emerald hover:bg-emerald hover:text-white px-8 py-4 rounded-xl transition-all duration-300"
            >
              زيارة المدونة
              <ArrowRight className={`w-5 h-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};