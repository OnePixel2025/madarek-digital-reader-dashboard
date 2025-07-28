import React from 'react';
import { Users, Heart, ArrowRight, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const PartnershipSection = () => {
  const { t, direction } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-r from-sandstone/10 via-background to-emerald/10">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-sandstone/20 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 items-center">
                {/* Content */}
                <div className="p-8 lg:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-sandstone/10 rounded-lg flex items-center justify-center mr-4">
                      <Handshake className="w-6 h-6 text-sandstone" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
                      {t('partnershipTitle')}
                    </h2>
                  </div>
                  
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {t('partnershipText')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/partners">
                      <Button 
                        size="lg"
                        className="bg-sandstone hover:bg-sandstone/90 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                      >
                        <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        {t('joinPartner')}
                        <ArrowRight className={`w-5 h-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform duration-300`} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Visual */}
                <div className="relative p-8 lg:p-12 bg-gradient-to-br from-sandstone/5 to-emerald/5">
                  <div className="relative">
                    {/* Partner Network Visualization */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Central Hub */}
                      <div className="col-span-3 flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-sandstone to-emerald rounded-2xl flex items-center justify-center shadow-lg">
                          <Heart className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      
                      {/* Partner Nodes */}
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex justify-center">
                          <div className="w-12 h-12 bg-card border-2 border-sandstone/20 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-300">
                            <Users className="w-6 h-6 text-sandstone" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Connecting Lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-32 h-32 border-2 border-dashed border-sandstone/30 rounded-full animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gold/20 rounded-full animate-bounce" />
                  <div className="absolute bottom-8 left-4 w-6 h-6 bg-emerald/20 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};