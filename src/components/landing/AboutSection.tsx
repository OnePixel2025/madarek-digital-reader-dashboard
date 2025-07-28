import React from 'react';
import { ArrowRight, BookOpen, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const AboutSection = () => {
  const { t, direction } = useLanguage();

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-sandstone/10 rounded-lg flex items-center justify-center mr-4">
                  <BookOpen className="w-6 h-6 text-sandstone" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
                  {t('about')}
                </h2>
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('aboutText')}
              </p>

              <Link to="/about">
                <Button 
                  variant="outline" 
                  className="border-sandstone text-sandstone hover:bg-sandstone hover:text-white transition-all duration-300"
                >
                  {t('ourStory')}
                  <ArrowRight className={`w-4 h-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>

            {/* Visual Elements */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-emerald/10 p-6 rounded-2xl">
                    <Users className="w-8 h-8 text-emerald mb-4" />
                    <h3 className="font-semibold text-charcoal mb-2">للمجتمع</h3>
                    <p className="text-sm text-muted-foreground">خدمة الباحثين والطلاب</p>
                  </div>
                  <div className="bg-gold/10 p-6 rounded-2xl">
                    <Globe className="w-8 h-8 text-orange-600 mb-4" />
                    <h3 className="font-semibold text-charcoal mb-2">عالمياً</h3>
                    <p className="text-sm text-muted-foreground">وصول للمعرفة السودانية</p>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="bg-sandstone/10 p-6 rounded-2xl">
                    <BookOpen className="w-8 h-8 text-sandstone mb-4" />
                    <h3 className="font-semibold text-charcoal mb-2">محفوظة</h3>
                    <p className="text-sm text-muted-foreground">حفظ التراث الرقمي</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Circle */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald/20 to-sandstone/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};