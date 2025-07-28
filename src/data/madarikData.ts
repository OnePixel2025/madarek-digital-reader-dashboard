// Dummy data for Madarik landing page

export const featuredCollections = [
  {
    id: 1,
    title: { ar: "التاريخ السوداني", en: "Sudanese History" },
    description: { 
      ar: "مجموعة شاملة من الكتب التاريخية عن السودان", 
      en: "Comprehensive collection of historical books about Sudan" 
    },
    bookCount: 45,
    image: "/api/placeholder/300/400",
  },
  {
    id: 2,
    title: { ar: "الأدب السوداني الحديث", en: "Modern Sudanese Literature" },
    description: { 
      ar: "أعمال أدبية حديثة من كتاب وشعراء سودانيين", 
      en: "Modern literary works by Sudanese writers and poets" 
    },
    bookCount: 32,
    image: "/api/placeholder/300/400",
  },
  {
    id: 3,
    title: { ar: "الجامعات والكتب الدراسية", en: "Universities and Academic Books" },
    description: { 
      ar: "مناهج ومراجع دراسية من الجامعات السودانية", 
      en: "Curricula and academic references from Sudanese universities" 
    },
    bookCount: 78,
    image: "/api/placeholder/300/400",
  },
  {
    id: 4,
    title: { ar: "المخطوطات المحفوظة", en: "Preserved Manuscripts" },
    description: { 
      ar: "مخطوطات تاريخية نادرة تم رقمنتها وحفظها", 
      en: "Rare historical manuscripts digitized and preserved" 
    },
    bookCount: 23,
    image: "/api/placeholder/300/400",
  }
];

export const featuredAuthors = [
  {
    id: 1,
    name: "الطيب صالح",
    bio: { 
      ar: "أديب سوداني عالمي، صاحب رواية موسم الهجرة إلى الشمال", 
      en: "International Sudanese writer, author of Season of Migration to the North" 
    },
    avatar: "/api/placeholder/150/150",
    bookCount: 12,
  },
  {
    id: 2,
    name: "محمد عبد الرحيم",
    bio: { 
      ar: "مؤرخ وكاتب متخصص في التاريخ السوداني", 
      en: "Historian and writer specializing in Sudanese history" 
    },
    avatar: "/api/placeholder/150/150",
    bookCount: 8,
  },
  {
    id: 3,
    name: "فاطمة محمد إبراهيم",
    bio: { 
      ar: "شاعرة وكاتبة سودانية معاصرة", 
      en: "Contemporary Sudanese poet and writer" 
    },
    avatar: "/api/placeholder/150/150",
    bookCount: 6,
  },
  {
    id: 4,
    name: "أحمد الطيب زين العابدين",
    bio: { 
      ar: "باحث في الثقافة والتراث السوداني", 
      en: "Researcher in Sudanese culture and heritage" 
    },
    avatar: "/api/placeholder/150/150",
    bookCount: 15,
  },
  {
    id: 5,
    name: "عائشة عبد الرحمن",
    bio: { 
      ar: "أكاديمية ومؤلفة في مجال التعليم", 
      en: "Academic and author in the field of education" 
    },
    avatar: "/api/placeholder/150/150",
    bookCount: 9,
  }
];

export const blogPosts = [
  {
    id: 1,
    title: { 
      ar: "10 كتب سودانية لا غنى عنها للطلاب", 
      en: "10 Essential Sudanese Books for Students" 
    },
    excerpt: { 
      ar: "قائمة بأهم الكتب السودانية التي يحتاجها كل طالب", 
      en: "A list of the most important Sudanese books every student needs" 
    },
    image: "/api/placeholder/400/250",
    date: "2024-01-15",
    readTime: "5 دقائق",
  },
  {
    id: 2,
    title: { 
      ar: "كيف يساهم الذكاء الاصطناعي في حفظ التراث الثقافي؟", 
      en: "How AI Contributes to Cultural Heritage Preservation?" 
    },
    excerpt: { 
      ar: "نظرة على دور التكنولوجيا في حفظ ونشر الثقافة السودانية", 
      en: "A look at technology's role in preserving and spreading Sudanese culture" 
    },
    image: "/api/placeholder/400/250",
    date: "2024-01-10",
    readTime: "7 دقائق",
  },
  {
    id: 3,
    title: { 
      ar: "التعلّم النشط: من القراءة إلى بطاقات المراجعة", 
      en: "Active Learning: From Reading to Review Cards" 
    },
    excerpt: { 
      ar: "كيف تحول قراءتك إلى تعلم فعال باستخدام تقنيات حديثة", 
      en: "How to turn your reading into effective learning using modern techniques" 
    },
    image: "/api/placeholder/400/250",
    date: "2024-01-05",
    readTime: "6 دقائق",
  }
];

export const stats = [
  {
    id: 1,
    value: 500,
    label: { ar: "كتاباً مُرقمناً", en: "Books Digitized" },
    prefix: "+",
  },
  {
    id: 2,
    value: 10000,
    label: { ar: "ملخصاً ذكياً", en: "Smart Summaries" },
    prefix: "+",
  },
  {
    id: 3,
    value: 2000,
    label: { ar: "طالباً استفادوا من أدواتنا", en: "Students Helped" },
    prefix: "+",
  }
];

export const aiTools = [
  {
    id: 1,
    title: { ar: "الدردشة مع الكتاب", en: "Chat with Book" },
    description: { 
      ar: "اسأل أي سؤال واحصل على إجابة من محتوى الكتاب.", 
      en: "Ask any question and get answers from the book's content." 
    },
    icon: "MessageCircle",
  },
  {
    id: 2,
    title: { ar: "الملخصات الذكية", en: "Smart Summaries" },
    description: { 
      ar: "ملخصات فورية للفصول والكتب.", 
      en: "Instant summaries for chapters and books." 
    },
    icon: "FileText",
  },
  {
    id: 3,
    title: { ar: "الاستماع الصوتي", en: "Audio Listening" },
    description: { 
      ar: "استمع بدلاً من القراءة.", 
      en: "Listen instead of reading." 
    },
    icon: "Headphones",
  },
  {
    id: 4,
    title: { ar: "الاختبارات وبطاقات المراجعة", en: "Quizzes and Review Cards" },
    description: { 
      ar: "حوّل القراءة إلى تعلّم نشط.", 
      en: "Turn reading into active learning." 
    },
    icon: "Brain",
  },
  {
    id: 5,
    title: { ar: "البحث الدلالي الذكي", en: "Smart Semantic Search" },
    description: { 
      ar: "اعثر على المفاهيم بسرعة.", 
      en: "Find concepts quickly." 
    },
    icon: "Search",
  }
];