import { useEffect, useRef, useState } from "react";

const TEXT_MAP = {
  "Intelligent Travel Planner": {
    Japanese: "インテリジェント旅行プランナー",
    Spanish: "Planificador inteligente de viajes",
    French: "Planificateur de voyage intelligent",
    German: "Intelligenter Reiseplaner",
    Arabic: "مخطط سفر ذكي",
    Portuguese: "Planejador inteligente de viagens",
    Chinese: "智能旅行规划器",
  },
  "Explore your trip": {
    Japanese: "旅行を探索",
    Spanish: "Explora tu viaje",
    French: "Explorez votre voyage",
    German: "Reise erkunden",
    Arabic: "استكشف رحلتك",
    Portuguese: "Explore sua viagem",
    Chinese: "探索你的旅行",
  },
  "Pick what you want to check first": {
    Japanese: "最初に確認したい項目を選択",
    Spanish: "Elige qué revisar primero",
    French: "Choisissez quoi vérifier d’abord",
    German: "Wähle zuerst, was du prüfen möchtest",
    Arabic: "اختر ما تريد التحقق منه أولاً",
    Portuguese: "Escolha o que verificar primeiro",
    Chinese: "选择你想先查看的内容",
  },
  "Choose stays, flights, routes, activities, packages or trip safety. The results update based on your selected source and destination.": {
    Japanese:
      "宿泊、フライト、ルート、アクティビティ、パッケージ、旅行保険を選択できます。出発地と目的地に合わせて結果が更新されます。",
    Spanish:
      "Elige alojamientos, vuelos, rutas, actividades, paquetes o seguridad del viaje. Los resultados se actualizan según origen y destino.",
    French:
      "Choisissez séjours, vols, itinéraires, activités, forfaits ou sécurité du voyage. Les résultats s’adaptent à votre départ et destination.",
    German:
      "Wähle Unterkünfte, Flüge, Routen, Aktivitäten, Pakete oder Reiseschutz. Die Ergebnisse passen sich Start und Ziel an.",
    Arabic:
      "اختر الإقامة أو الرحلات أو المسارات أو الأنشطة أو الباقات أو حماية السفر. يتم تحديث النتائج حسب نقطة الانطلاق والوجهة.",
    Portuguese:
      "Escolha estadias, voos, rotas, atividades, pacotes ou proteção de viagem. Os resultados mudam conforme origem e destino.",
    Chinese:
      "选择住宿、航班、路线、活动、套餐或旅行保障。结果会根据出发地和目的地自动更新。",
  },
  Current: {
    Japanese: "現在",
    Spanish: "Actual",
    French: "Actuel",
    German: "Aktuell",
    Arabic: "الحالي",
    Portuguese: "Atual",
    Chinese: "当前",
  },
  Flights: {
    Japanese: "フライト",
    Spanish: "Vuelos",
    French: "Vols",
    German: "Flüge",
    Arabic: "رحلات جوية",
    Portuguese: "Voos",
    Chinese: "航班",
  },
  Hotels: {
    Japanese: "ホテル",
    Spanish: "Hoteles",
    French: "Hôtels",
    German: "Hotels",
    Arabic: "فنادق",
    Portuguese: "Hotéis",
    Chinese: "酒店",
  },
  Homes: {
    Japanese: "ホームステイ",
    Spanish: "Casas",
    French: "Maisons",
    German: "Unterkünfte",
    Arabic: "منازل",
    Portuguese: "Casas",
    Chinese: "民宿",
  },
  Packages: {
    Japanese: "パッケージ",
    Spanish: "Paquetes",
    French: "Forfaits",
    German: "Pakete",
    Arabic: "باقات",
    Portuguese: "Pacotes",
    Chinese: "套餐",
  },
  Trains: {
    Japanese: "電車",
    Spanish: "Trenes",
    French: "Trains",
    German: "Züge",
    Arabic: "قطارات",
    Portuguese: "Trens",
    Chinese: "火车",
  },
  Buses: {
    Japanese: "バス",
    Spanish: "Autobuses",
    French: "Bus",
    German: "Busse",
    Arabic: "حافلات",
    Portuguese: "Ônibus",
    Chinese: "巴士",
  },
  Cabs: {
    Japanese: "タクシー",
    Spanish: "Taxis",
    French: "Taxis",
    German: "Taxis",
    Arabic: "سيارات أجرة",
    Portuguese: "Táxis",
    Chinese: "出租车",
  },
  Tours: {
    Japanese: "ツアー",
    Spanish: "Tours",
    French: "Visites",
    German: "Touren",
    Arabic: "جولات",
    Portuguese: "Passeios",
    Chinese: "旅行体验",
  },
  Insurance: {
    Japanese: "保険",
    Spanish: "Seguro",
    French: "Assurance",
    German: "Versicherung",
    Arabic: "تأمين",
    Portuguese: "Seguro",
    Chinese: "保险",
  },
  "Best for city-to-city and international trips": {
    Japanese: "都市間や海外旅行に最適",
    Spanish: "Ideal para viajes entre ciudades e internacionales",
    French: "Idéal pour les trajets entre villes et internationaux",
    German: "Ideal für Städte- und Auslandsreisen",
    Arabic: "الأفضل للرحلات بين المدن والدول",
    Portuguese: "Ideal para viagens entre cidades e internacionais",
    Chinese: "适合城市间和国际旅行",
  },
  "Find stays at your destination": {
    Japanese: "目的地の宿泊先を探す",
    Spanish: "Encuentra estancias en tu destino",
    French: "Trouvez des séjours à destination",
    German: "Unterkünfte am Ziel finden",
    Arabic: "اعثر على إقامات في وجهتك",
    Portuguese: "Encontre estadias no destino",
    Chinese: "查找目的地住宿",
  },
  "Real places and things to do": {
    Japanese: "実在する場所とアクティビティ",
    Spanish: "Lugares reales y actividades",
    French: "Lieux réels et activités",
    German: "Echte Orte und Aktivitäten",
    Arabic: "أماكن حقيقية وأنشطة",
    Portuguese: "Lugares reais e atividades",
    Chinese: "真实景点和可做活动",
  },
  "Plan your trip": {
    Japanese: "旅行を計画",
    Spanish: "Planifica tu viaje",
    French: "Planifiez votre voyage",
    German: "Reise planen",
    Arabic: "خطط رحلتك",
    Portuguese: "Planeje sua viagem",
    Chinese: "规划你的旅行",
  },
  "Trip plan ready": {
    Japanese: "旅行プラン準備完了",
    Spanish: "Plan de viaje listo",
    French: "Plan de voyage prêt",
    German: "Reiseplan bereit",
    Arabic: "خطة الرحلة جاهزة",
    Portuguese: "Plano de viagem pronto",
    Chinese: "旅行计划已准备好",
  },
  Overview: {
    Japanese: "概要",
    Spanish: "Resumen",
    French: "Aperçu",
    German: "Überblick",
    Arabic: "نظرة عامة",
    Portuguese: "Visão geral",
    Chinese: "概览",
  },
  Itinerary: {
    Japanese: "旅程表",
    Spanish: "Itinerario",
    French: "Itinéraire",
    German: "Reiseplan",
    Arabic: "برنامج الرحلة",
    Portuguese: "Roteiro",
    Chinese: "行程",
  },
  Agents: {
    Japanese: "エージェント",
    Spanish: "Agentes",
    French: "Agents",
    German: "Agenten",
    Arabic: "الوكلاء",
    Portuguese: "Agentes",
    Chinese: "智能代理",
  },
  Budget: {
    Japanese: "予算",
    Spanish: "Presupuesto",
    French: "Budget",
    German: "Budget",
    Arabic: "الميزانية",
    Portuguese: "Orçamento",
    Chinese: "预算",
  },
  Export: {
    Japanese: "エクスポート",
    Spanish: "Exportar",
    French: "Exporter",
    German: "Exportieren",
    Arabic: "تصدير",
    Portuguese: "Exportar",
    Chinese: "导出",
  },
  Refresh: {
    Japanese: "更新",
    Spanish: "Actualizar",
    French: "Actualiser",
    German: "Aktualisieren",
    Arabic: "تحديث",
    Portuguese: "Atualizar",
    Chinese: "刷新",
  },
  "View details": {
    Japanese: "詳細を見る",
    Spanish: "Ver detalles",
    French: "Voir les détails",
    German: "Details ansehen",
    Arabic: "عرض التفاصيل",
    Portuguese: "Ver detalhes",
    Chinese: "查看详情",
  },
};

const PLACEHOLDER_MAP = {
  "source city": {
    Japanese: "出発地",
    Spanish: "ciudad de origen",
    French: "ville de départ",
    German: "Startstadt",
    Arabic: "مدينة الانطلاق",
    Portuguese: "cidade de origem",
    Chinese: "出发城市",
  },
  "destination city": {
    Japanese: "目的地",
    Spanish: "ciudad de destino",
    French: "ville de destination",
    German: "Zielstadt",
    Arabic: "مدينة الوجهة",
    Portuguese: "cidade de destino",
    Chinese: "目的地城市",
  },
};

const CURRENCY_META = {
  INR: { symbol: "₹", rateFromInr: 1, locale: "en-IN" },
  USD: { symbol: "$", rateFromInr: 0.012, locale: "en-US" },
  EUR: { symbol: "€", rateFromInr: 0.011, locale: "de-DE" },
  GBP: { symbol: "£", rateFromInr: 0.0095, locale: "en-GB" },
};

function getCurrentSettings() {
  try {
    return JSON.parse(localStorage.getItem("a2a_travel_settings") || "{}");
  } catch {
    return {};
  }
}

function shouldSkipNode(node) {
  const parent = node.parentElement;

  if (!parent) return true;

  if (parent.closest("[data-no-runtime-translate='true']")) {
    return true;
  }

  const tag = parent.tagName?.toLowerCase();

  return ["script", "style", "textarea", "input", "select", "option"].includes(
    tag,
  );
}

function translateText(originalText, language) {
  if (language === "English") return originalText;

  const trimmed = String(originalText || "").trim();

  if (!trimmed) return originalText;

  const replacement = TEXT_MAP[trimmed]?.[language];

  if (!replacement) return originalText;

  return String(originalText).replace(trimmed, replacement);
}

function translatePlaceholder(originalValue, language) {
  if (language === "English") return originalValue;

  const trimmed = String(originalValue || "").trim();

  if (!trimmed) return originalValue;

  return PLACEHOLDER_MAP[trimmed]?.[language] || originalValue;
}

function formatConvertedAmount(amountInInr, currency) {
  const meta = CURRENCY_META[currency] || CURRENCY_META.INR;
  const converted = amountInInr * meta.rateFromInr;

  return `${meta.symbol}${Math.round(converted).toLocaleString(meta.locale)}`;
}

function convertCurrencyText(originalText, currency) {
  if (currency === "INR") return originalText;

  return String(originalText).replace(
    /₹\s?([\d,]+)([^\d₹]*)/g,
    (match, numberPart, suffix) => {
      const amountInInr = Number(String(numberPart).replace(/,/g, ""));

      if (!Number.isFinite(amountInInr)) return match;

      return `${formatConvertedAmount(amountInInr, currency)}${suffix || ""}`;
    },
  );
}

function setDocumentLanguage(language) {
  const htmlLangMap = {
    English: "en",
    Japanese: "ja",
    Spanish: "es",
    French: "fr",
    German: "de",
    Arabic: "ar",
    Portuguese: "pt",
    Chinese: "zh",
  };

  document.documentElement.setAttribute("lang", htmlLangMap[language] || "en");
  document.documentElement.setAttribute("dir", language === "Arabic" ? "rtl" : "ltr");
}

export default function LanguageRuntime() {
  const [settings, setSettings] = useState(() => {
    const stored = getCurrentSettings();

    return {
      language: stored.language || "English",
      currency: stored.currency || "INR",
    };
  });

  const originalTextRef = useRef(new WeakMap());
  const originalPlaceholderRef = useRef(new WeakMap());

  function applyPreferences(nextSettings) {
    const language = nextSettings.language || "English";
    const currency = nextSettings.currency || "INR";

    setDocumentLanguage(language);

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;

          const text = node.nodeValue || "";

          if (!text.trim()) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      if (!originalTextRef.current.has(node)) {
        originalTextRef.current.set(node, node.nodeValue || "");
      }

      const originalText = originalTextRef.current.get(node) || "";
      const translatedText = translateText(originalText, language);
      const convertedText = convertCurrencyText(translatedText, currency);

      node.nodeValue = convertedText;
    });

    document.querySelectorAll("input[placeholder]").forEach((input) => {
      if (input.closest("[data-no-runtime-translate='true']")) return;

      if (!originalPlaceholderRef.current.has(input)) {
        originalPlaceholderRef.current.set(
          input,
          input.getAttribute("placeholder") || "",
        );
      }

      const originalPlaceholder = originalPlaceholderRef.current.get(input) || "";

      input.setAttribute(
        "placeholder",
        translatePlaceholder(originalPlaceholder, language),
      );
    });
  }

  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof MutationObserver === "undefined") {
      observerRef.current = null;
      return;
    }

    let timer = null;

    const observer = new MutationObserver(() => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        const stored = getCurrentSettings();

        applyPreferences({
          language: stored.language || "English",
          currency: stored.currency || "INR",
        });
      }, 80);
    });

    observerRef.current = observer;

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleSettingsChanged(event) {
      const nextSettings = {
        language: event.detail?.language || "English",
        currency: event.detail?.currency || "INR",
      };

      setSettings(nextSettings);

      setTimeout(() => {
        applyPreferences(nextSettings);
      }, 50);
    }

    window.addEventListener("a2a_settings_changed", handleSettingsChanged);

    return () => {
      window.removeEventListener("a2a_settings_changed", handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    applyPreferences(settings);

    if (!observerRef.current) return undefined;

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [settings]);

  return null;
}