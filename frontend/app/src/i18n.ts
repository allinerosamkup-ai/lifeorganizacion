import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
    resources: {
        pt: { translation: pt },
        en: { translation: en },
    },
    lng: localStorage.getItem('airia-lang') || 'pt',
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
});

// Persist language choice
i18n.on('languageChanged', (lng: string) => {
    localStorage.setItem('airia-lang', lng);
});

export default i18n;
