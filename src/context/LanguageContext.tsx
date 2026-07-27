import { createContext, useContext, useState, ReactNode } from "react";
import t, { LANGUAGES } from "@/lib/translations";
import type { LangCode, TranslationKey } from "@/lib/translations";

const LANG_KEY = "sf_language";

interface LanguageContextType {
    lang: LangCode;
    setLang: (lang: LangCode) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    languages: typeof LANGUAGES;
    currentLanguage: typeof LANGUAGES[number];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<LangCode>(() => {
        const stored = localStorage.getItem(LANG_KEY) as LangCode | null;
        return stored && LANGUAGES.some((l) => l.code === stored) ? stored : "en";
    });

    const setLang = (newLang: LangCode) => {
        setLangState(newLang);
        localStorage.setItem(LANG_KEY, newLang);
    };

    const translate = (key: TranslationKey, vars?: Record<string, string | number>): string => {
        const dict = t[lang] ?? t["en"];
        let str = dict[key] ?? t["en"][key] ?? key;
        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    };

    const currentLanguage = LANGUAGES.find((l) => l.code === lang)!;

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: translate, languages: LANGUAGES, currentLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}
