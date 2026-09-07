/**
 * Lightweight UI translation layer for ArtisanLink.
 * Language is remembered in localStorage and synced to the artisan's profile.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { LanguageCode } from "@/lib/artisan";

const STORAGE_KEY = "artisanlink.language";

const en = {
  "nav.marketplace": "Marketplace",
  "nav.artisans": "Artisans",
  "nav.about": "How it works",
  "nav.dashboard": "Dashboard",
  "nav.addProduct": "Add product",
  "nav.myProducts": "My products",
  "nav.saved": "Saved",
  "nav.settings": "Settings",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.notifications": "Notifications",
  "nav.language": "Language",

  "dash.greeting": "Namaste",
  "dash.subtitle": "Photograph a product and the AI writes the listing for you.",
  "dash.addProduct": "Add a product",
  "dash.products": "Products",
  "dash.views": "Total views",
  "dash.interest": "Buyer interest",
  "dash.unread": "Unread alerts",
  "dash.latest": "Your latest listings",
  "dash.manageAll": "Manage all",
  "dash.empty": "You have not listed anything yet.",
  "dash.emptyCta": "Upload your first product photo",

  "mine.title": "My products",
  "mine.empty": "Nothing listed yet.",
  "mine.publish": "Publish",
  "mine.unpublish": "Unpublish",
  "mine.removed": "Product removed",

  "settings.title": "Profile settings",
  "settings.name": "Full name",
  "settings.phone": "Phone",
  "settings.location": "Village or city",
  "settings.craft": "Craft speciality",
  "settings.craftPlaceholder": "Choose your craft",
  "settings.language": "Preferred language",
  "settings.bio": "About you",
  "settings.bioPlaceholder": "Your craft tradition, years of experience, your family workshop...",
  "settings.save": "Save profile",
  "settings.saving": "Saving...",
  "settings.saved": "Profile updated",
} as const;

export type TranslationKey = keyof typeof en;

const dictionaries: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en,
  hi: {
    "nav.marketplace": "बाज़ार",
    "nav.artisans": "कारीगर",
    "nav.about": "यह कैसे काम करता है",
    "nav.dashboard": "डैशबोर्ड",
    "nav.addProduct": "उत्पाद जोड़ें",
    "nav.myProducts": "मेरे उत्पाद",
    "nav.saved": "सहेजे गए",
    "nav.settings": "सेटिंग्स",
    "nav.signIn": "साइन इन करें",
    "nav.signOut": "साइन आउट",
    "nav.notifications": "सूचनाएँ",
    "nav.language": "भाषा",

    "dash.greeting": "नमस्ते",
    "dash.subtitle": "उत्पाद की फ़ोटो लीजिए, बाक़ी विवरण AI लिख देगा।",
    "dash.addProduct": "उत्पाद जोड़ें",
    "dash.products": "उत्पाद",
    "dash.views": "कुल दृश्य",
    "dash.interest": "ख़रीदारों की रुचि",
    "dash.unread": "नई सूचनाएँ",
    "dash.latest": "आपकी नई सूचियाँ",
    "dash.manageAll": "सब देखें",
    "dash.empty": "आपने अभी तक कुछ सूचीबद्ध नहीं किया है।",
    "dash.emptyCta": "अपनी पहली उत्पाद फ़ोटो अपलोड करें",

    "mine.title": "मेरे उत्पाद",
    "mine.empty": "अभी कुछ सूचीबद्ध नहीं है।",
    "mine.publish": "प्रकाशित करें",
    "mine.unpublish": "अप्रकाशित करें",
    "mine.removed": "उत्पाद हटा दिया गया",

    "settings.title": "प्रोफ़ाइल सेटिंग्स",
    "settings.name": "पूरा नाम",
    "settings.phone": "फ़ोन",
    "settings.location": "गाँव या शहर",
    "settings.craft": "शिल्प विशेषज्ञता",
    "settings.craftPlaceholder": "अपना शिल्प चुनें",
    "settings.language": "पसंदीदा भाषा",
    "settings.bio": "आपके बारे में",
    "settings.bioPlaceholder": "आपकी शिल्प परंपरा, अनुभव के वर्ष, आपकी कार्यशाला...",
    "settings.save": "प्रोफ़ाइल सहेजें",
    "settings.saving": "सहेजा जा रहा है...",
    "settings.saved": "प्रोफ़ाइल अपडेट हो गई",
  },
  kn: {
    "nav.marketplace": "ಮಾರುಕಟ್ಟೆ",
    "nav.artisans": "ಕುಶಲಕರ್ಮಿಗಳು",
    "nav.about": "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "nav.addProduct": "ಉತ್ಪನ್ನ ಸೇರಿಸಿ",
    "nav.myProducts": "ನನ್ನ ಉತ್ಪನ್ನಗಳು",
    "nav.saved": "ಉಳಿಸಿದವು",
    "nav.settings": "ಸಂಯೋಜನೆಗಳು",
    "nav.signIn": "ಸೈನ್ ಇನ್",
    "nav.signOut": "ಸೈನ್ ಔಟ್",
    "nav.notifications": "ಅಧಿಸೂಚನೆಗಳು",
    "nav.language": "ಭಾಷೆ",

    "dash.greeting": "ನಮಸ್ಕಾರ",
    "dash.subtitle": "ಉತ್ಪನ್ನದ ಫೋಟೋ ತೆಗೆಯಿರಿ, ವಿವರಗಳನ್ನು AI ಬರೆಯುತ್ತದೆ.",
    "dash.addProduct": "ಉತ್ಪನ್ನ ಸೇರಿಸಿ",
    "dash.products": "ಉತ್ಪನ್ನಗಳು",
    "dash.views": "ಒಟ್ಟು ವೀಕ್ಷಣೆಗಳು",
    "dash.interest": "ಖರೀದಿದಾರರ ಆಸಕ್ತಿ",
    "dash.unread": "ಓದದ ಅಧಿಸೂಚನೆಗಳು",
    "dash.latest": "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಪಟ್ಟಿಗಳು",
    "dash.manageAll": "ಎಲ್ಲವನ್ನೂ ನಿರ್ವಹಿಸಿ",
    "dash.empty": "ನೀವು ಇನ್ನೂ ಏನನ್ನೂ ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.",
    "dash.emptyCta": "ನಿಮ್ಮ ಮೊದಲ ಉತ್ಪನ್ನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",

    "mine.title": "ನನ್ನ ಉತ್ಪನ್ನಗಳು",
    "mine.empty": "ಇನ್ನೂ ಏನೂ ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.",
    "mine.publish": "ಪ್ರಕಟಿಸಿ",
    "mine.unpublish": "ಪ್ರಕಟಣೆ ಹಿಂಪಡೆಯಿರಿ",
    "mine.removed": "ಉತ್ಪನ್ನ ತೆಗೆದುಹಾಕಲಾಗಿದೆ",

    "settings.title": "ಪ್ರೊಫೈಲ್ ಸಂಯೋಜನೆಗಳು",
    "settings.name": "ಪೂರ್ಣ ಹೆಸರು",
    "settings.phone": "ದೂರವಾಣಿ",
    "settings.location": "ಹಳ್ಳಿ ಅಥವಾ ನಗರ",
    "settings.craft": "ಕರಕುಶಲ ಪರಿಣತಿ",
    "settings.craftPlaceholder": "ನಿಮ್ಮ ಕರಕುಶಲವನ್ನು ಆರಿಸಿ",
    "settings.language": "ಇಷ್ಟದ ಭಾಷೆ",
    "settings.bio": "ನಿಮ್ಮ ಬಗ್ಗೆ",
    "settings.bioPlaceholder": "ನಿಮ್ಮ ಕರಕುಶಲ ಪರಂಪರೆ, ಅನುಭವ, ನಿಮ್ಮ ಕಾರ್ಯಾಗಾರ...",
    "settings.save": "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
    "settings.saving": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "settings.saved": "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ",
  },
  ta: {
    "nav.marketplace": "சந்தை",
    "nav.artisans": "கைவினைஞர்கள்",
    "nav.about": "இது எப்படி வேலை செய்கிறது",
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.addProduct": "பொருளைச் சேர்",
    "nav.myProducts": "என் பொருட்கள்",
    "nav.saved": "சேமித்தவை",
    "nav.settings": "அமைப்புகள்",
    "nav.signIn": "உள்நுழை",
    "nav.signOut": "வெளியேறு",
    "nav.notifications": "அறிவிப்புகள்",
    "nav.language": "மொழி",

    "dash.greeting": "வணக்கம்",
    "dash.subtitle": "பொருளின் புகைப்படத்தை எடுங்கள், விவரங்களை AI எழுதும்.",
    "dash.addProduct": "பொருளைச் சேர்",
    "dash.products": "பொருட்கள்",
    "dash.views": "மொத்த பார்வைகள்",
    "dash.interest": "வாங்குபவர் ஆர்வம்",
    "dash.unread": "படிக்காத அறிவிப்புகள்",
    "dash.latest": "உங்கள் சமீபத்திய பட்டியல்கள்",
    "dash.manageAll": "அனைத்தையும் நிர்வகி",
    "dash.empty": "நீங்கள் இன்னும் எதையும் பட்டியலிடவில்லை.",
    "dash.emptyCta": "உங்கள் முதல் பொருள் புகைப்படத்தைப் பதிவேற்றுங்கள்",

    "mine.title": "என் பொருட்கள்",
    "mine.empty": "இன்னும் எதுவும் பட்டியலிடப்படவில்லை.",
    "mine.publish": "வெளியிடு",
    "mine.unpublish": "வெளியீட்டை நீக்கு",
    "mine.removed": "பொருள் நீக்கப்பட்டது",

    "settings.title": "சுயவிவர அமைப்புகள்",
    "settings.name": "முழு பெயர்",
    "settings.phone": "தொலைபேசி",
    "settings.location": "கிராமம் அல்லது நகரம்",
    "settings.craft": "கைவினைத் தேர்ச்சி",
    "settings.craftPlaceholder": "உங்கள் கைவினையைத் தேர்வுசெய்க",
    "settings.language": "விருப்ப மொழி",
    "settings.bio": "உங்களைப் பற்றி",
    "settings.bioPlaceholder": "உங்கள் கைவினை மரபு, அனுபவ ஆண்டுகள், உங்கள் பட்டறை...",
    "settings.save": "சுயவிவரத்தைச் சேமி",
    "settings.saving": "சேமிக்கிறது...",
    "settings.saved": "சுயவிவரம் புதுப்பிக்கப்பட்டது",
  },
};

type LanguageValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Restore the saved choice after hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && stored in dictionaries) setLanguageState(stored);
  }, []);

  // Adopt the signed-in artisan's saved preference.
  useEffect(() => {
    const pref = profile?.preferred_language as LanguageCode | undefined;
    if (pref && pref in dictionaries) {
      setLanguageState(pref);
      window.localStorage.setItem(STORAGE_KEY, pref);
    }
  }, [profile?.preferred_language]);

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      setLanguageState(code);
      window.localStorage.setItem(STORAGE_KEY, code);
      if (user) {
        void supabase
          .from("profiles")
          .update({ preferred_language: code })
          .eq("id", user.id)
          .then(() => refreshProfile());
      }
    },
    [user, refreshProfile],
  );

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => dictionaries[language]?.[key] ?? en[key],
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
