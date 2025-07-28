import React from 'react';
import { BookOpen, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const { t, language, setLanguage } = useLanguage();

  const quickLinks = [
    { label: t('home'), href: '/' },
    { label: t('library'), href: '/library' },
    { label: t('aiTools'), href: 'https://app.madarik.com' },
    { label: t('partnerships'), href: '/partners' },
    { label: t('blog'), href: '/blog' },
    { label: t('about'), href: '/about' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-charcoal text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald to-sandstone rounded-xl flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">مدارك</span>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              منصة رقمية لحفظ المعرفة السودانية وتعزيزها بالذكاء الاصطناعي
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 hover:bg-emerald/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">روابط سريعة</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-emerald transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-emerald transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-white/80">
                <Mail className="w-5 h-5 mr-3 text-emerald" />
                <span dir="ltr">info@madarik.com</span>
              </li>
              <li className="flex items-center text-white/80">
                <Phone className="w-5 h-5 mr-3 text-emerald" />
                <span dir="ltr">+249 123 456 789</span>
              </li>
              <li className="flex items-start text-white/80">
                <MapPin className="w-5 h-5 mr-3 mt-1 text-emerald" />
                <span>الخرطوم، السودان</span>
              </li>
            </ul>
          </div>

          {/* Language Switcher & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">اللغة</h3>
            <div className="flex gap-2 mb-6">
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('ar')}
                className="bg-emerald hover:bg-emerald/90 border-emerald"
              >
                العربية
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="bg-emerald hover:bg-emerald/90 border-emerald"
              >
                English
              </Button>
            </div>
            
            <h4 className="text-md font-semibold mb-3">روابط مفيدة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-white/80 hover:text-emerald transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/80 hover:text-emerald transition-colors">
                  شروط الاستخدام
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-white/80 hover:text-emerald transition-colors">
                  الدعم التقني
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              {t('copyright')}
            </p>
            <div className="flex items-center space-x-6 rtl:space-x-reverse text-sm text-white/60">
              <span>صُنع بـ ❤️ في السودان</span>
              <span>|</span>
              <a 
                href="https://app.madarik.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-emerald transition-colors"
              >
                جرّب التطبيق
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};