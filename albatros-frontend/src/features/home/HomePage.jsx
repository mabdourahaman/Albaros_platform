import { Link } from "react-router-dom";
import { useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import SettingsControls from "../../components/common/SettingsControls";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Menu,
} from "lucide-react";
import heroImage from "../../assets/home_page_pic.jpg";

export default function HomePage() {
  const { language, darkMode, setLanguage } = useSettings();

  const content = {
    en: {
      home: "Home",
      about: "About",
      courses: "Courses",
      contact: "Contact",
      login: "Login",
      register: "Register",
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
    },
    fr: {
      home: "Accueil",
      about: "À propos",
      courses: "Cours",
      contact: "Contact",
      login: "Connexion",
      register: "Inscription",
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
    },
    ar: {
      home: "الرئيسية",
      about: "حول المنصة",
      courses: "الدروس",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
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
    },
  };

  const t = content[language];

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
          <Link
            to="/"
            className="h-full px-6 md:px-10 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-lg bg-cyan-500 text-white flex items-center justify-center">
              <GraduationCap size={28} />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-wide text-cyan-500">
              ALBATROS
            </span>
          </Link>

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

          <div className="flex items-center h-full gap-2">
            <SettingsControls />

            {/* Login button - secondary style */}
            <Link
              to="/login"
              className={`hidden md:flex items-center px-6 py-2 rounded-xl font-bold transition ${
                darkMode
                  ? "bg-slate-800 text-white hover:bg-slate-700"
                  : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.login}
            </Link>

            {/* Register button - primary style */}
            <Link
              to="/register"
              className="hidden md:flex items-center px-6 py-2 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
            >
              {t.register}
              <ArrowRight size={18} className="ml-2" />
            </Link>

            <button className="lg:hidden px-5">
              <Menu size={28} />
            </button>
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
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
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
                to="/login"
                className="px-8 py-4 bg-cyan-500 text-white font-bold text-center hover:bg-cyan-600 transition rounded-xl"
              >
                {t.primaryBtn}
              </Link>
              <Link
                to="#"
                className="px-8 py-4 bg-white text-slate-900 font-bold text-center hover:bg-slate-100 transition rounded-xl"
              >
                {t.secondaryBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className={`py-20 ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}
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