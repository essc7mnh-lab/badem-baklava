// 🌟 قاموس المصطلحات الفاخرة ودوال الترجمة الفورية لمتجر بادَم BADEM

export const GOURMET_DICTIONARY: Record<string, string> = {
  "بقلاوة": "Royal Baklava",
  "عنتابية": "Antep Signature",
  "عنتابي": "Antep",
  "فستق": "Pistachio",
  "فستق حلبي": "Aleppo Pistachio",
  "فستق عنتاب": "Antep Pistachio",
  "سارما": "Royal Sarma Rolls",
  "سمن بلدي": "Pure Clarified Butter",
  "سمن بلدي نقي": "Artisan Clarified Butter",
  "سمن بقري": "Artisan Pure Butter",
  "عسل": "Blossom Honey",
  "قشطة": "Fresh Clotted Cream (Kaymak)",
  "شوكولاتة": "Belgian Chocolate",
  "شوكولاته": "Belgian Chocolate",
  "جوز": "Crispy Walnuts",
  "عين الجمل": "Royal Walnuts",
  "كاجو": "Roasted Cashews",
  "هيل": "Aromatic Cardamom",
  "زعفران": "Royal Saffron",
  "ماء ورد": "Rose Water Infusion",
  "ماء زهر": "Orange Blossom Water",
  "عش البلبل": "Bird's Nest Pastry",
  "مبرومة": "Twisted Pistachio Roll",
  "أصابع": "Golden Filo Fingers",
  "دولما": "Pistachio Dolma",
  "بوكس": "Luxury Box",
  "صندوق": "Royal ",
  "مشكل": "Signature Assortment",
  "مشكلة": "Signature Assortment",
  "طازج": "Freshly Baked",
  "طازجة": "Freshly Baked",
  "شاي": "Turkish Black Tea",
  "قهوة": "Traditional Artisan Coffee",
  "عرض حصري": "Exclusive Royal Offer",
  "عرض خاص": "Special Reserve Offer",
  "خصم": "Discount",
  "ملكي": "Royal",
  "ملكية": "Royal",
  "فاخر": "Luxury",
  "فاخرة": "Luxury",
};

export const ARABIC_PHONETICS: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "aa", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
  "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "ah", "ء": "'", "ئ": "e", "ؤ": "o",
  " ": " "
};

export const QUICK_INGREDIENT_ICONS = ["🥜", "🧈", "🍯", "🌰", "🥛", "🌾", "🍫", "🌸", "🍋", "✨"];

/**
 * ترجمة النصوص العربية إلى مصطلحات إنجليزية فاخرة مخصصة للحلويات
 */
export function translateToGourmetEnglish(arabicText: string): string {
  if (!arabicText || !arabicText.trim()) return "";
  let text = arabicText.trim();

  for (const [ar, en] of Object.entries(GOURMET_DICTIONARY)) {
    const regex = new RegExp(`\\b${ar}\\b|${ar}`, "gi");
    text = text.replace(regex, ` ${en} `);
  }

  const words = text.split(/\s+/).filter(Boolean);
  const translatedWords = words.map((word) => {
    if (/^[a-zA-Z0-9&%().'-]+$/.test(word)) return word;
    let phon = "";
    for (let i = 0; i < word.length; i++) {
      phon += ARABIC_PHONETICS[word[i]] || word[i];
    }
    return phon ? phon.charAt(0).toUpperCase() + phon.slice(1) : "";
  });

  return translatedWords
    .join(" ")
    .replace(/[،,]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * توليد معرّف رابط نظيف ومتوافق مع محركات البحث
 */
export function generateCleanSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-") || `item-${Date.now()}`;
}