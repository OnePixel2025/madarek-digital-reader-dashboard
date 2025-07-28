import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

export const NewsletterSection = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Mock API call to /api/subscribe
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "نجح الاشتراك!",
          description: t('subscribeSuccess'),
        });
        setEmail('');
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: t('subscribeError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-emerald/5 via-background to-gold/5">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-emerald/20 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald to-sandstone p-1">
                <div className="bg-background p-8 md:p-12 rounded-lg">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald to-sandstone rounded-2xl flex items-center justify-center">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                      {t('newsletterTitle')}
                    </h2>
                    
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      {t('newsletterSubtext')}
                    </p>
                  </div>

                  {/* Newsletter Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-12 px-4 text-lg border-2 border-border focus:border-emerald rounded-xl bg-card"
                          dir="ltr"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="bg-emerald hover:bg-emerald/90 text-white px-8 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            {t('subscribe')}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Benefits */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald" />
                      <span>تحديثات أسبوعية</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald" />
                      <span>كتب جديدة</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald" />
                      <span>أدوات ذكية جديدة</span>
                    </div>
                  </div>

                  {/* Privacy Note */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      نحترم خصوصيتك ولن نشارك بريدك الإلكتروني مع أطراف ثالثة
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};