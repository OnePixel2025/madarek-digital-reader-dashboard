import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { stats } from '@/data/madarikData';

const CounterAnimation: React.FC<{ 
  end: number; 
  duration?: number; 
  prefix?: string;
  isVisible: boolean;
}> = ({ end, duration = 2000, prefix = "", isVisible }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOut * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, hasAnimated, end, duration]);

  return (
    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald to-sandstone bg-clip-text text-transparent">
      {prefix}{count.toLocaleString()}
    </span>
  );
};

export const StatsSection = () => {
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-charcoal text-white overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-emerald rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-sandstone rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              إحصائيات الإنجاز
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald to-sandstone mx-auto rounded-full" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.id} 
                className="text-center group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-emerald/50">
                  <div className="mb-4">
                    <CounterAnimation 
                      end={stat.value} 
                      prefix={stat.prefix}
                      isVisible={isVisible}
                    />
                  </div>
                  <p className="text-lg text-white/80 group-hover:text-white transition-colors duration-300">
                    {stat.label[language]}
                  </p>
                  
                  {/* Decorative Element */}
                  <div className="mt-4 w-16 h-1 bg-gradient-to-r from-emerald to-sandstone mx-auto rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Additional Context */}
          <div className="text-center mt-16">
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              منذ إطلاق منصة مدارك، نواصل العمل على رقمنة التراث السوداني وتسهيل الوصول إليه
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};