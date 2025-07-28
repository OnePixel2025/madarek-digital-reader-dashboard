import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { BooksSection } from '@/components/landing/BooksSection';
import { AIToolsSection } from '@/components/landing/AIToolsSection';
import { PartnershipSection } from '@/components/landing/PartnershipSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { BlogSection } from '@/components/landing/BlogSection';
import { NewsletterSection } from '@/components/landing/NewsletterSection';
import { Footer } from '@/components/landing/Footer';

export const MadarikLanding = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <BooksSection />
        <AIToolsSection />
        <PartnershipSection />
        <StatsSection />
        <BlogSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};