import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  ar: {
    // Hero Section
    heroHeadline: "مدارك – معرفة محفوظة ومدعومة بالذكاء الاصطناعي.",
    heroSubheadline: "اكتشف الكتب السودانية، وتعلّم أسرع مع الملخصات، والاستماع الصوتي، وبطاقات المراجعة — حتى بدون إنترنت.",
    searchPlaceholder: "ابحث عن كتاب أو مؤلف…",
    exploreBooks: "استكشف الكتب",
    tryAI: "جرّب المساعد الذكي",
    partnersText: "بدعم من مبادرات المجتمع مثل Mastoorat",

    // About Us
    aboutText: "مدارك منصة رقمية لحفظ المعرفة السودانية، digitizing الكتب وإتاحتها مع أدوات تعليمية مدعومة بالذكاء الاصطناعي، لتصل للطلاب والباحثين داخل السودان وخارجه.",
    ourStory: "اعرف قصتنا",

    // Books Section
    featuredBooksTitle: "الكتب والمجموعات المميزة",
    sudaneseHistory: "التاريخ السوداني",
    modernLiterature: "الأدب السوداني الحديث",
    academicBooks: "الجامعات والكتب الدراسية",
    manuscripts: "المخطوطات المحفوظة",
    viewBooks: "عرض الكتب",
    browseLibrary: "استعرض المكتبة كاملة",

    // AI Tools
    aiToolsTitle: "أدوات الذكاء الاصطناعي لتعليم أعمق",
    chatWithBook: "الدردشة مع الكتاب — اسأل أي سؤال واحصل على إجابة من محتوى الكتاب.",
    smartSummaries: "الملخصات الذكية — ملخصات فورية للفصول والكتب.",
    audioListening: "الاستماع الصوتي (TTS) — استمع بدلاً من القراءة.",
    quizCards: "الاختبارات وبطاقات المراجعة — حوّل القراءة إلى تعلّم نشط.",
    semanticSearch: "البحث الدلالي الذكي — اعثر على المفاهيم بسرعة.",
    tryAITools: "جرّب الأدوات الذكية الآن",

    // Partnership
    partnershipTitle: "ساهم معنا في حفظ التراث السوداني",
    partnershipText: "نتعاون مع مبادرات مثل مسطورات (Mastoorat) لرقمنة الكتب السودانية ونشرها. هل ترغب بالمساهمة أو الشراكة؟",
    joinPartner: "انضم كشريك",

    // Stats
    booksDigitized: "كتاباً مُرقمناً",
    smartSummariesCount: "ملخصاً ذكياً",
    studentsHelped: "طالباً استفادوا من أدواتنا",

    // Blog
    blogTitle: "من المدونة",
    blogPost1: "10 كتب سودانية لا غنى عنها للطلاب",
    blogPost2: "كيف يساهم الذكاء الاصطناعي في حفظ التراث الثقافي؟",
    blogPost3: "التعلّم النشط: من القراءة إلى بطاقات المراجعة",
    readMore: "قراءة المزيد",

    // Newsletter
    newsletterTitle: "اشترك في النشرة البريدية لمدارك",
    newsletterSubtext: "تابع آخر الكتب المضافة، وأدوات الذكاء الاصطناعي، وجهود الحفظ.",
    emailPlaceholder: "بريدك الإلكتروني",
    subscribe: "اشترك",
    subscribeSuccess: "تم الاشتراك بنجاح!",
    subscribeError: "حدث خطأ. حاول مرة أخرى.",

    // Navigation
    home: "الرئيسية",
    library: "المكتبة",
    aiTools: "الأدوات الذكية",
    partnerships: "الشراكات",
    blog: "المدونة",
    about: "من نحن",
    contact: "تواصل معنا",
    copyright: "© 2024 مدارك. جميع الحقوق محفوظة.",
  },
  en: {
    // Hero Section
    heroHeadline: "Madarik – Preserved Knowledge Powered by AI.",
    heroSubheadline: "Discover Sudanese books, learn faster with summaries, audio listening, and review cards — even offline.",
    searchPlaceholder: "Search for a book or author…",
    exploreBooks: "Explore Books",
    tryAI: "Try AI Assistant",
    partnersText: "Supported by community initiatives like Mastoorat",

    // About Us
    aboutText: "Madarik is a digital platform for preserving Sudanese knowledge, digitizing books and making them accessible with AI-powered educational tools, reaching students and researchers inside and outside Sudan.",
    ourStory: "Learn Our Story",

    // Books Section
    featuredBooksTitle: "Featured Books and Collections",
    sudaneseHistory: "Sudanese History",
    modernLiterature: "Modern Sudanese Literature",
    academicBooks: "Universities and Academic Books",
    manuscripts: "Preserved Manuscripts",
    viewBooks: "View Books",
    browseLibrary: "Browse Full Library",

    // AI Tools
    aiToolsTitle: "AI Tools for Deeper Learning",
    chatWithBook: "Chat with Book — Ask any question and get answers from the book's content.",
    smartSummaries: "Smart Summaries — Instant summaries for chapters and books.",
    audioListening: "Audio Listening (TTS) — Listen instead of reading.",
    quizCards: "Quizzes and Review Cards — Turn reading into active learning.",
    semanticSearch: "Smart Semantic Search — Find concepts quickly.",
    tryAITools: "Try AI Tools Now",

    // Partnership
    partnershipTitle: "Help Us Preserve Sudanese Heritage",
    partnershipText: "We collaborate with initiatives like Mastoorat to digitize and publish Sudanese books. Would you like to contribute or partner with us?",
    joinPartner: "Join as Partner",

    // Stats
    booksDigitized: "Books Digitized",
    smartSummariesCount: "Smart Summaries",
    studentsHelped: "Students Helped",

    // Blog
    blogTitle: "From the Blog",
    blogPost1: "10 Essential Sudanese Books for Students",
    blogPost2: "How AI Contributes to Cultural Heritage Preservation?",
    blogPost3: "Active Learning: From Reading to Review Cards",
    readMore: "Read More",

    // Newsletter
    newsletterTitle: "Subscribe to Madarik Newsletter",
    newsletterSubtext: "Follow the latest added books, AI tools, and preservation efforts.",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
    subscribeSuccess: "Successfully subscribed!",
    subscribeError: "An error occurred. Please try again.",

    // Navigation
    home: "Home",
    library: "Library",
    aiTools: "AI Tools",
    partnerships: "Partnerships",
    blog: "Blog",
    about: "About Us",
    contact: "Contact Us",
    copyright: "© 2024 Madarik. All rights reserved.",
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar'); // Arabic as default
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('madarik-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('madarik-language') as Language;
    if (savedLang && ['ar', 'en'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};