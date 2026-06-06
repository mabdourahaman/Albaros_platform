import { Link } from "react-router-dom";
import { useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import SettingsControls from "../../components/common/SettingsControls";
import { BookOpen, GraduationCap, Menu, X, UserPlus, Mail, Phone, MapPin } from "lucide-react";
import heroImage from "../../assets/home_page_pic.jpg";

export default function HomePage() {
  const { language, darkMode, setLanguage } = useSettings();

  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const content = {
    en: {
      home: "Home",
      about: "About",
      courses: "Courses",
      contact: "Contact",
      login: "Login",
      register: "Register",
      teacherLogin: "Teacher Login",
      adminLogin: "Admin Login",
      staffAccess: "Staff Access",
      studentAccess: "Student Access",
      badge: "Best Online Learning Platform",
      title: "Get Educated Online From Your Home",
      description:
        "Albatros is a modern e-learning platform that helps students learn better through courses, exercises, quizzes, progress tracking, and personalized recommendations.",
      primaryBtn: "Start Learning",
      secondaryBtn: "Learn More",
      sectionTitle: "Why Choose Albatros?",
      card1Title: "Personalized Learning",
      card1Text:
        "Students can learn at their own pace with content adapted to their level.",
      card2Title: "Progress Tracking",
      card2Text:
        "Follow scores, weak topics, and improvement with simple dashboards.",
      card3Title: "Teacher Support",
      card3Text:
        "Teachers can manage courses, exercises, and monitor students easily.",
      coursesTitle: "Our Courses",
      coursesSubtitle:
        "Albatros offers essential school subjects with lessons, exercises, quizzes, and personalized recommendations.",
      math: "Mathematics",
      mathText: "Learn numbers, operations, geometry, problem solving, and practice with interactive exercises.",
      french: "French",
      frenchText: "Improve reading, writing, grammar, vocabulary, and communication skills.",
      english: "English",
      englishText: "Build vocabulary, grammar, pronunciation, reading, and simple communication skills.",
      informatics: "Informatics",
      informaticsText: "Discover computers, files, internet basics, digital tools, and introduction to programming.",
      contactTitle: "Contact Us",
      contactSubtitle:
        "Need help or more information? Contact the Albatros team.",
      email: "support@albatros.ma",
      phone: "+212 600 000 000",
      address: "Meknes, Morocco",
    },

    fr: {
      home: "Accueil",
      about: "À propos",
      courses: "Cours",
      contact: "Contact",
      login: "Connexion",
      register: "Inscription",
      teacherLogin: "Connexion Enseignant",
      adminLogin: "Connexion Admin",
      staffAccess: "Accès Personnel",
      studentAccess: "Accès Élève",
      badge: "Meilleure plateforme d'apprentissage en ligne",
      title: "Apprenez en ligne depuis chez vous",
      description:
        "Albatros est une plateforme e-learning moderne qui aide les élèves à mieux apprendre grâce aux cours, exercices, quiz, suivi de progression et recommandations personnalisées.",
      primaryBtn: "Commencer",
      secondaryBtn: "En savoir plus",
      sectionTitle: "Pourquoi choisir Albatros ?",
      card1Title: "Apprentissage personnalisé",
      card1Text:
        "Les élèves peuvent apprendre à leur rythme avec un contenu adapté à leur niveau.",
      card2Title: "Suivi de progression",
      card2Text:
        "Suivez les notes, les points faibles et l’amélioration avec des tableaux simples.",
      card3Title: "Support enseignant",
      card3Text:
        "Les enseignants peuvent gérer les cours, les exercices et suivre les élèves facilement.",
      coursesTitle: "Nos Cours",
      coursesSubtitle:
        "Albatros propose des matières essentielles avec des leçons, exercices, quiz et recommandations personnalisées.",
      math: "Mathématiques",
      mathText: "Apprenez les nombres, les opérations, la géométrie, les problèmes et entraînez-vous avec des exercices.",
      french: "Français",
      frenchText: "Améliorez la lecture, l’écriture, la grammaire, le vocabulaire et la communication.",
      english: "Anglais",
      englishText: "Développez le vocabulaire, la grammaire, la prononciation, la lecture et la communication simple.",
      informatics: "Informatique",
      informaticsText: "Découvrez l’ordinateur, les fichiers, internet, les outils numériques et les bases de la programmation.",
      contactTitle: "Contactez-nous",
      contactSubtitle:
        "Besoin d’aide ou d’informations ? Contactez l’équipe Albatros.",
      email: "support@albatros.ma",
      phone: "+212 600 000 000",
      address: "Meknès, Maroc",
    },

    ar: {
      home: "الرئيسية",
      about: "حول المنصة",
      courses: "الدروس",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      teacherLogin: "دخول الأستاذ",
      adminLogin: "دخول المسؤول",
      staffAccess: "دخول الطاقم",
      studentAccess: "دخول التلميذ",
      badge: "أفضل منصة للتعلم عن بعد",
      title: "تعلم عبر الإنترنت من منزلك",
      description:
        "ألباتروس منصة تعليمية حديثة تساعد التلاميذ على التعلم بشكل أفضل من خلال الدروس، التمارين، الاختبارات، تتبع التقدم، والتوصيات الشخصية.",
      primaryBtn: "ابدأ التعلم",
      secondaryBtn: "اعرف المزيد",
      sectionTitle: "لماذا تختار ألباتروس؟",
      card1Title: "تعلم مخصص",
      card1Text:
        "يمكن للتلاميذ التعلم حسب مستواهم وبالسرعة المناسبة لهم.",
      card2Title: "تتبع التقدم",
      card2Text:
        "تتبع النتائج، نقاط الضعف، والتحسن من خلال لوحات بسيطة.",
      card3Title: "دعم الأساتذة",
      card3Text:
        "يمكن للأساتذة إدارة الدروس والتمارين ومتابعة التلاميذ بسهولة.",
      coursesTitle: "دروسنا",
      coursesSubtitle:
        "توفر ألباتروس مواد أساسية مع دروس وتمارين واختبارات وتوصيات مخصصة.",
      math: "الرياضيات",
      mathText: "تعلم الأعداد، العمليات، الهندسة، حل المسائل والتدرب بتمارين تفاعلية.",
      french: "الفرنسية",
      frenchText: "تحسين القراءة، الكتابة، القواعد، المفردات ومهارات التواصل.",
      english: "الإنجليزية",
      englishText: "تطوير المفردات، القواعد، النطق، القراءة والتواصل البسيط.",
      informatics: "الإعلاميات",
      informaticsText: "اكتشاف الحاسوب، الملفات، الإنترنت، الأدوات الرقمية وأساسيات البرمجة.",
      contactTitle: "اتصل بنا",
      contactSubtitle:
        "هل تحتاج إلى مساعدة أو معلومات؟ تواصل مع فريق ألباتروس.",
      email: "support@albatros.ma",
      phone: "+212 600 000 000",
      address: "مكناس، المغرب",
    },
  };

  const t = content[language];

  const dropdownBox = darkMode
    ? "bg-slate-900 border-slate-700 text-white"
    : "bg-white border-slate-200 text-slate-900";

  const dropdownTitle = darkMode ? "text-slate-400" : "text-slate-500";

  const dropdownItem = darkMode
    ? "text-slate-100 hover:bg-slate-800"
    : "text-slate-800 hover:bg-slate-100";

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen transition ${
        darkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      }`}
    >
      <header
        className={`fixed top-0 left-0 right-0 z-50 shadow-sm ${
          darkMode ? "bg-slate-950" : "bg-white"
        }`}
      >
        <nav className="h-20 flex items-center justify-between">
          <div className="h-full px-4 md:px-10 flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => {
                setStaffMenuOpen(!staffMenuOpen);
                setMobileMenuOpen(false);
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                darkMode
                  ? "text-white hover:bg-slate-800"
                  : "text-slate-800 hover:bg-slate-100"
              }`}
            >
              {staffMenuOpen ? <X size={28} /> : <Menu size={30} />}
            </button>

            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-cyan-500 text-white flex items-center justify-center">
                <GraduationCap size={28} />
              </div>

              <span className="text-2xl md:text-3xl font-extrabold tracking-wide text-cyan-500">
                ALBATROS
              </span>
            </Link>

            {staffMenuOpen && (
              <div
                className={`absolute top-16 left-4 md:left-10 w-72 rounded-2xl border shadow-2xl p-3 z-[9999] ${dropdownBox}`}
              >
                <p
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-widest ${dropdownTitle}`}
                >
                  {t.staffAccess}
                </p>

                <Link
                  to="/login/teacher"
                  onClick={() => setStaffMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl font-extrabold transition ${dropdownItem}`}
                >
                  <BookOpen size={22} />
                  {t.teacherLogin}
                </Link>

                <Link
                  to="/login/admin"
                  onClick={() => setStaffMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl font-extrabold transition ${dropdownItem}`}
                >
                  <GraduationCap size={22} />
                  {t.adminLogin}
                </Link>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-10 font-bold uppercase text-sm tracking-wide">
            <a href="#home" className="text-cyan-500">
              {t.home}
            </a>

            <a
              href="#about"
              className={darkMode ? "text-slate-200" : "text-slate-700"}
            >
              {t.about}
            </a>

            <a
              href="#courses"
              className={darkMode ? "text-slate-200" : "text-slate-700"}
            >
              {t.courses}
            </a>

            <a
              href="#contact"
              className={darkMode ? "text-slate-200" : "text-slate-700"}
            >
              {t.contact}
            </a>
          </div>

          <div className="flex items-center h-full gap-2 pr-4 md:pr-6 relative">
            <SettingsControls />

            <Link
              to="/login/student"
              className="hidden md:flex items-center justify-center min-w-[115px] px-6 py-3 rounded-xl bg-cyan-500 text-white font-extrabold hover:bg-cyan-600 transition shadow-sm"
            >
              {t.login}
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setStaffMenuOpen(false);
              }}
              className={`md:hidden w-12 h-12 rounded-xl flex items-center justify-center transition ${
                darkMode
                  ? "bg-slate-900 text-white border border-slate-700 hover:bg-slate-800"
                  : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={28} />}
            </button>

            {mobileMenuOpen && (
              <div
                className={`absolute top-16 right-4 w-64 rounded-2xl border shadow-2xl p-3 z-[9999] ${dropdownBox}`}
              >
                <p
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-widest ${dropdownTitle}`}
                >
                  {t.studentAccess}
                </p>

                <Link
                  to="/login/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl font-extrabold transition ${dropdownItem}`}
                >
                  <GraduationCap size={22} />
                  {t.login}
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl font-extrabold transition ${dropdownItem}`}
                >
                  <UserPlus size={22} />
                  {t.register}
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="md:hidden px-4 pb-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border outline-none ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-700"
            }`}
>
          <option
            value="en"
            className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
          >
            English
          </option>

          <option
            value="fr"
            className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
          >
            Français
          </option>

          <option
            value="ar"
            className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
          >
           العربية
          </option>
          </select>
        </div>
      </header>

      <section
        id="home"
        className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />

        <div
          className={`absolute inset-0 ${
            darkMode ? "bg-slate-950/75" : "bg-slate-950/60"
          }`}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
          <div className="max-w-3xl">
            <p className="text-cyan-400 font-extrabold uppercase tracking-[0.25em] text-sm md:text-base">
              {t.badge}
            </p>

            <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              {t.title}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-100 leading-relaxed max-w-2xl">
              {t.description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/login/student"
                className="px-8 py-4 bg-cyan-500 text-white font-extrabold text-center hover:bg-cyan-600 transition rounded-xl shadow-lg"
              >
                {t.primaryBtn}
              </Link>

              <a
                href="#about"
                className="px-8 py-4 bg-white text-slate-900 font-extrabold text-center hover:bg-slate-100 transition rounded-xl shadow-lg"
              >
                {t.secondaryBtn}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className={`scroll-mt-24 py-20 ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-cyan-500 font-extrabold uppercase tracking-widest">
              Albatros
            </p>

            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold">
              {t.sectionTitle}
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              darkMode={darkMode}
              icon={<BookOpen size={34} />}
              title={t.card1Title}
              text={t.card1Text}
            />

            <FeatureCard
              darkMode={darkMode}
              icon={<GraduationCap size={34} />}
              title={t.card2Title}
              text={t.card2Text}
            />

            <FeatureCard
              darkMode={darkMode}
              icon={<BookOpen size={34} />}
              title={t.card3Title}
              text={t.card3Text}
            />
          </div>
        </div>
      </section>

      <section
        id="courses"
        className={`scroll-mt-24 py-20 ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-cyan-500 font-extrabold uppercase tracking-widest">
              {t.courses}
            </p>

            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold">
              {t.coursesTitle}
            </h2>

            <p
              className={`mt-5 text-lg leading-relaxed ${
                darkMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {t.coursesSubtitle}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <CourseCard darkMode={darkMode} title={t.math} text={t.mathText} />
            <CourseCard darkMode={darkMode} title={t.french} text={t.frenchText} />
            <CourseCard darkMode={darkMode} title={t.english} text={t.englishText} />
            <CourseCard darkMode={darkMode} title={t.informatics} text={t.informaticsText} />
          </div>
        </div>
      </section>

      <section
        id="contact"
        className={`scroll-mt-24 py-20 ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-cyan-500 font-extrabold uppercase tracking-widest">
              {t.contact}
            </p>

            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold">
              {t.contactTitle}
            </h2>

            <p
              className={`mt-5 text-lg ${
                darkMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {t.contactSubtitle}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <ContactCard
              darkMode={darkMode}
              icon={<Mail size={30} />}
              title="Email"
              value={t.email}
            />

            <ContactCard
              darkMode={darkMode}
              icon={<Phone size={30} />}
              title="Phone"
              value={t.phone}
            />

            <ContactCard
              darkMode={darkMode}
              icon={<MapPin size={30} />}
              title="Address"
              value={t.address}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, text, darkMode }) {
  return (
    <div
      className={`p-8 rounded-2xl border transition hover:-translate-y-2 ${
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-cyan-500 text-white flex items-center justify-center">
        {icon}
      </div>

      <h3 className="mt-6 text-2xl font-extrabold">{title}</h3>

      <p
        className={`mt-4 leading-relaxed ${
          darkMode ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CourseCard({ title, text, darkMode }) {
  return (
    <div
      className={`p-7 rounded-3xl border transition hover:-translate-y-2 ${
        darkMode
          ? "bg-slate-950 border-slate-800"
          : "bg-slate-50 border-slate-100 shadow-sm"
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center">
        <BookOpen size={28} />
      </div>

      <h3 className="mt-6 text-2xl font-extrabold">{title}</h3>

      <p
        className={`mt-4 leading-relaxed ${
          darkMode ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function ContactCard({ icon, title, value, darkMode }) {
  return (
    <div
      className={`p-8 rounded-3xl border text-center transition hover:-translate-y-2 ${
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500 text-white flex items-center justify-center">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-extrabold">{title}</h3>

      <p
        className={`mt-3 font-semibold ${
          darkMode ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}