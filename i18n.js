const translations = {
    "en": {
        "nav_game": "24 Challenge",
        "nav_contact": "Contact",
        "game_title": "The 24 Challenge",
        "puzzle_counter": "Puzzle #{current} of {total}",
        "btn_new": "New Puzzle",
        "btn_gen_all": "Generate All",
        "btn_show_ans": "Show Answer",
        "btn_add_hist": "Add to History",
        "btn_back": "&larr; Back",
        "btn_next": "Next &rarr;",
        "btn_go": "Go to puzzle",
        "btn_check": "Check My Solution",
        "chk_remember": "Remember my puzzle history",
        "btn_clear_hist": "Clear All History",
        "contact_title": "Contact SealMath",
        "lbl_name": "Name",
        "lbl_email": "Email",
        "lbl_message": "Message",
        "btn_send": "Send Message",
        "ph_expr": "(4 + 8) * (8 - 6)",
        
        // JS Feedback Messages
        "msg_saved": "Saved!",
        "msg_invalid_char": "Invalid characters!",
        "msg_use_all": "Use all four numbers!",
        "msg_correct": "Correct!",
        "msg_incorrect": "Incorrect: {result}",
        "msg_invalid_expr": "Invalid expression",
        "msg_all_checked": "All combinations checked!",
        "msg_gen_success": "Generated {count} new puzzles!",
        "msg_enter_between": "Please enter a number between 1 and {max}",
        "msg_no_solution": "No solution found.",
        "msg_solution_found": "Solution: {sol}",
        "msg_sending": "Sending...",
        "msg_sent_success": "Message sent!",
        "msg_sent_fail": "Failed to send.",
        "msg_del_confirm": "Delete all saved puzzles?",
        "msg_hist_cleared": "History Cleared",
        "msg_not_found": "Could not find a new puzzle. Try again!"
    },
    "he": {
        "nav_game": "אתגר ה-24",
        "nav_contact": "צור קשר",
        "game_title": "אתגר ה-24",
        "puzzle_counter": "חידה #{current} מתוך {total}",
        "btn_new": "חידה חדשה",
        "btn_gen_all": "צור הכל",
        "btn_show_ans": "הראה תשובה",
        "btn_add_hist": "הוסף להיסטוריה",
        "btn_back": "&rarr; חזור",
        "btn_next": "הבא &larr;",
        "btn_go": "עבור לחידה",
        "btn_check": "בדוק את התשובה שלי",
        "chk_remember": "זכור את היסטוריית החידות שלי",
        "btn_clear_hist": "נקה היסטוריה",
        "contact_title": "צור קשר עם SealMath",
        "lbl_name": "שם",
        "lbl_email": "אימייל",
        "lbl_message": "הודעה",
        "btn_send": "שלח הודעה",
        "ph_expr": "(4 + 8) * (8 - 6)",

        // JS Feedback Messages
        "msg_saved": "נשמר!",
        "msg_invalid_char": "תווים לא חוקיים!",
        "msg_use_all": "השתמש בכל ארבעת המספרים!",
        "msg_correct": "נכון!",
        "msg_incorrect": "לא נכון: {result}",
        "msg_invalid_expr": "ביטוי לא חוקי",
        "msg_all_checked": "כל השילובים נבדקו!",
        "msg_gen_success": "נוצרו {count} חידות חדשות!",
        "msg_enter_between": "נא להזין מספר בין 1 ל-{max}",
        "msg_no_solution": "לא נמצא פתרון.",
        "msg_solution_found": "פתרון: {sol}",
        "msg_sending": "שולח...",
        "msg_sent_success": "ההודעה נשלחה!",
        "msg_sent_fail": "השליחה נכשלה.",
        "msg_del_confirm": "האם למחוק את כל החידות השמורות?",
        "msg_hist_cleared": "היסטוריה נוקתה",
        "msg_not_found": "לא הצלחנו למצוא חידה חדשה. נסה שוב!"
    },
    "nl": {
        "nav_game": "24 Uitdaging",
        "nav_contact": "Contact",
        "game_title": "De 24 Uitdaging",
        "puzzle_counter": "Puzzel #{current} van {total}",
        "btn_new": "Nieuwe Puzzel",
        "btn_gen_all": "Genereer Alles",
        "btn_show_ans": "Toon Antwoord",
        "btn_add_hist": "Voeg toe aan Geschiedenis",
        "btn_back": "&larr; Terug",
        "btn_next": "Volgende &rarr;",
        "btn_go": "Ga naar puzzel",
        "btn_check": "Controleer Mijn Oplossing",
        "chk_remember": "Onthoud mijn puzzelgeschiedenis",
        "btn_clear_hist": "Wis Alle Geschiedenis",
        "contact_title": "Neem Contact op met SealMath",
        "lbl_name": "Naam",
        "lbl_email": "E-mail",
        "lbl_message": "Bericht",
        "btn_send": "Stuur Bericht",
        "ph_expr": "(4 + 8) * (8 - 6)",

        // JS Feedback Messages
        "msg_saved": "Opgeslagen!",
        "msg_invalid_char": "Ongeldige tekens!",
        "msg_use_all": "Gebruik alle vier de getallen!",
        "msg_correct": "Correct!",
        "msg_incorrect": "Onjuist: {result}",
        "msg_invalid_expr": "Ongeldige expressie",
        "msg_all_checked": "Alle combinaties gecontroleerd!",
        "msg_gen_success": "{count} nieuwe puzzels gegenereerd!",
        "msg_enter_between": "Voer een getal in tussen 1 en {max}",
        "msg_no_solution": "Geen oplossing gevonden.",
        "msg_solution_found": "Oplossing: {sol}",
        "msg_sending": "Verzenden...",
        "msg_sent_success": "Bericht verzonden!",
        "msg_sent_fail": "Verzenden mislukt.",
        "msg_del_confirm": "Alle opgeslagen puzzels verwijderen?",
        "msg_hist_cleared": "Geschiedenis Gewist",
        "msg_not_found": "Kon geen nieuwe puzzel vinden. Probeer het opnieuw!"
    }
};

let currentLang = 'en';

function setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    
    // Update directionality for Hebrew
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = translations[lang]["game_title"];
    if (document.getElementById('lang-switcher')) {
        document.getElementById('lang-switcher').value = lang;
    }

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if(key === 'ph_expr') el.placeholder = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key]; // innerHTML for entities like &rarr;
            }
        }
    });

    // We manually trigger any JS UI updates required that have variables inside strings
    if (typeof updateNavButtons === 'function') updateNavButtons();
}

function detectDefaultLanguage() {
    const saved = localStorage.getItem('preferredLang');
    if (saved && translations[saved]) return saved;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const locale = navigator.language || "";

    if (tz.includes('Jerusalem') || locale.startsWith('he') || locale.includes('IL')) return 'he';
    if (tz.includes('Amsterdam') || locale.startsWith('nl')) return 'nl';
    return 'en';
}

function t(key, params = {}) {
    let str = translations[currentLang][key] || key;
    for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}

window.addEventListener('DOMContentLoaded', () => {
    const defaultLang = detectDefaultLanguage();
    setLanguage(defaultLang);
});
