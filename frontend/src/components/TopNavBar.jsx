import { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Globe,
  Heart,
  Languages,
  Loader2,
  LogOut,
  Map,
  Plane,
  Plus,
  User,
  Wallet,
  X,
} from "lucide-react";

import AuthModal from "./AuthModal";
import LanguageRuntime from "./LanguageRuntime";
import { logoutUser } from "../api/authApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const LANGUAGES = [
  "English",
  "Japanese",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Portuguese",
  "Chinese",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const NAV_TEXT = {
  English: {
    tagline: "Intelligent Travel Planner",
    listProperty: "List Property",
    wishlist: "Wishlist",
    myTrips: "My Trips",
    login: "Login / Create Account",
    logout: "Logout",
    propertyTitle: "List your property",
    propertySubtitle:
      "Add a hotel, homestay, resort, villa or apartment lead. This works locally for demo without paid services.",
    loginRecommended: "Login recommended",
    loginRecommendedText:
      "You can continue, but logging in links this property lead to your account.",
    loginFirst: "Login first",
    propertyName: "Property name",
    city: "City",
    propertyType: "Property type",
    contact: "Contact email or phone",
    submitProperty: "Submit property",
    propertySaved: "Property lead saved",
    propertySavedText: "The top button is now a working website action.",
    wishlistTitle: "Wishlist",
    wishlistSubtitle:
      "Saved travel options will appear here. This keeps the user inside the website flow.",
    noSavedItems: "No saved items yet",
    noSavedItemsText:
      "When users save hotels, tours or packages, they will appear here.",
    myTripsTitle: "My trips",
    myTripsSubtitle: "Recently generated and saved trip plans from your backend.",
    savedPlan: "Saved plan",
    noTrips: "No saved trips yet",
    noTripsText: "Generate a trip plan and it will appear here.",
    settingsTitle: "Currency and language",
    settingsSubtitle:
      "Choose display preferences. Nothing changes until you click Apply.",
    currency: "Currency",
    language: "Language",
    apply: "Apply changes",
    close: "Close",
    menu: "Menu",
    menuSubtitle: "Travel planner actions",
  },
  Japanese: {
    tagline: "インテリジェント旅行プランナー",
    listProperty: "宿泊施設を登録",
    wishlist: "ウィッシュリスト",
    myTrips: "マイトリップ",
    login: "ログイン / アカウント作成",
    logout: "ログアウト",
    propertyTitle: "宿泊施設を登録",
    propertySubtitle: "ホテル、ホームステイ、リゾート、ヴィラ、アパートを登録できます。",
    loginRecommended: "ログイン推奨",
    loginRecommendedText:
      "ログインすると、この登録情報をアカウントに紐づけできます。",
    loginFirst: "先にログイン",
    propertyName: "施設名",
    city: "都市",
    propertyType: "施設タイプ",
    contact: "連絡先メールまたは電話",
    submitProperty: "施設を送信",
    propertySaved: "施設情報を保存しました",
    propertySavedText: "このメニュー操作は正常に動作しています。",
    wishlistTitle: "ウィッシュリスト",
    wishlistSubtitle: "保存した旅行オプションがここに表示されます。",
    noSavedItems: "保存項目はありません",
    noSavedItemsText: "ホテル、ツアー、パッケージを保存すると表示されます。",
    myTripsTitle: "マイトリップ",
    myTripsSubtitle: "バックエンドに保存された最近の旅行プランです。",
    savedPlan: "保存済みプラン",
    noTrips: "保存済み旅行はありません",
    noTripsText: "旅行プランを作成するとここに表示されます。",
    settingsTitle: "通貨と言語",
    settingsSubtitle: "表示設定を選択し、適用をクリックしてください。",
    currency: "通貨",
    language: "言語",
    apply: "変更を適用",
    close: "閉じる",
    menu: "メニュー",
    menuSubtitle: "旅行プランナー操作",
  },
  Spanish: {
    tagline: "Planificador inteligente de viajes",
    listProperty: "Publicar propiedad",
    wishlist: "Lista de deseos",
    myTrips: "Mis viajes",
    login: "Iniciar sesión / Crear cuenta",
    logout: "Cerrar sesión",
    settingsTitle: "Moneda e idioma",
    settingsSubtitle: "Elige preferencias. Nada cambia hasta pulsar Aplicar.",
    currency: "Moneda",
    language: "Idioma",
    apply: "Aplicar cambios",
    close: "Cerrar",
  },
  French: {
    tagline: "Planificateur de voyage intelligent",
    listProperty: "Ajouter un établissement",
    wishlist: "Liste d’envies",
    myTrips: "Mes voyages",
    login: "Connexion / Créer un compte",
    logout: "Déconnexion",
    settingsTitle: "Devise et langue",
    settingsSubtitle:
      "Choisissez vos préférences. Rien ne change avant Appliquer.",
    currency: "Devise",
    language: "Langue",
    apply: "Appliquer",
    close: "Fermer",
  },
  German: {
    tagline: "Intelligenter Reiseplaner",
    listProperty: "Unterkunft eintragen",
    wishlist: "Wunschliste",
    myTrips: "Meine Reisen",
    login: "Anmelden / Konto erstellen",
    logout: "Abmelden",
    settingsTitle: "Währung und Sprache",
    settingsSubtitle: "Wähle Einstellungen. Erst Anwenden ändert die Website.",
    currency: "Währung",
    language: "Sprache",
    apply: "Änderungen anwenden",
    close: "Schließen",
  },
  Arabic: {
    tagline: "مخطط سفر ذكي",
    listProperty: "إضافة عقار",
    wishlist: "قائمة الرغبات",
    myTrips: "رحلاتي",
    login: "تسجيل الدخول / إنشاء حساب",
    logout: "تسجيل الخروج",
    settingsTitle: "العملة واللغة",
    settingsSubtitle: "اختر الإعدادات ثم اضغط تطبيق.",
    currency: "العملة",
    language: "اللغة",
    apply: "تطبيق التغييرات",
    close: "إغلاق",
  },
  Portuguese: {
    tagline: "Planejador inteligente de viagens",
    listProperty: "Anunciar propriedade",
    wishlist: "Lista de desejos",
    myTrips: "Minhas viagens",
    login: "Entrar / Criar conta",
    logout: "Sair",
    settingsTitle: "Moeda e idioma",
    settingsSubtitle: "Escolha preferências. Nada muda até clicar Aplicar.",
    currency: "Moeda",
    language: "Idioma",
    apply: "Aplicar mudanças",
    close: "Fechar",
  },
  Chinese: {
    tagline: "智能旅行规划器",
    listProperty: "发布房源",
    wishlist: "愿望清单",
    myTrips: "我的行程",
    login: "登录 / 创建账户",
    logout: "退出",
    settingsTitle: "货币和语言",
    settingsSubtitle: "选择显示偏好，然后点击应用。",
    currency: "货币",
    language: "语言",
    apply: "应用更改",
    close: "关闭",
  },
};

function getCopy(language) {
  return {
    ...NAV_TEXT.English,
    ...(NAV_TEXT[language] || {}),
  };
}

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getSavedUser() {
  try {
    const rawUser = localStorage.getItem("a2a_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getSavedSettings() {
  return readJsonStorage("a2a_travel_settings", {
    currency: "INR",
    language: "English",
  });
}

export default function TopNavBar() {
  const [activePanel, setActivePanel] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  useEffect(() => {
  function openAuthFromAnywhere() {
    setIsAuthOpen(true);
  }

  window.addEventListener("a2a_open_auth", openAuthFromAnywhere);

  return () => {
    window.removeEventListener("a2a_open_auth", openAuthFromAnywhere);
  };
}, []);
  const [user, setUser] = useState(getSavedUser);
  const [settings, setSettings] = useState(getSavedSettings);

  const copy = getCopy(settings.language);

  useEffect(() => {
    function syncSettings(event) {
      const nextSettings = event.detail || getSavedSettings();

      setSettings({
        currency: nextSettings.currency || "INR",
        language: nextSettings.language || "English",
      });
    }

    window.addEventListener("a2a_settings_changed", syncSettings);
    window.addEventListener("storage", syncSettings);

    return () => {
      window.removeEventListener("a2a_settings_changed", syncSettings);
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  async function handleLogout() {
    const token = localStorage.getItem("a2a_auth_token");

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
      // local logout still happens
    }

    localStorage.removeItem("a2a_auth_token");
    localStorage.removeItem("a2a_user");
    setUser(null);
  }

  function applySettings(nextSettings) {
    const cleanSettings = {
      currency: nextSettings.currency || "INR",
      language: nextSettings.language || "English",
    };

    localStorage.setItem("a2a_travel_settings", JSON.stringify(cleanSettings));
    setSettings(cleanSettings);

    window.dispatchEvent(
      new CustomEvent("a2a_settings_changed", {
        detail: cleanSettings,
      }),
    );

    setActivePanel(null);
  }

  return (
    <>
      <LanguageRuntime />

      <div data-no-runtime-translate="true">
        <nav className="relative z-40 mx-auto flex w-full max-w-[1640px] items-center justify-between px-5 py-6 lg:px-10 xl:px-16">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white shadow-xl backdrop-blur-xl ring-1 ring-white/20">
              <Plane className="h-6 w-6" />
            </div>

            <div>
              <p className="text-2xl font-black leading-none tracking-[-0.06em] text-white">
                A2A Trip
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-blue-100">
                {copy.tagline}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <TopButton
              icon={Briefcase}
              label={copy.listProperty}
              onClick={() => setActivePanel("property")}
            />

            <TopButton
              icon={Heart}
              label={copy.wishlist}
              onClick={() => setActivePanel("wishlist")}
            />

            <TopButton
              icon={Map}
              label={copy.myTrips}
              onClick={() => setActivePanel("trips")}
            />

            <TopButton
              icon={Globe}
              label={`${settings.currency} · ${settings.language}`}
              onClick={() => setActivePanel("settings")}
            />

            {user ? (
              <UserMenu
                user={user}
                onLogout={handleLogout}
                logoutLabel={copy.logout}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                {copy.login}
              </button>
            )}
          </div>

          <div className="flex xl:hidden">
            {user ? (
              <button
                type="button"
                onClick={() => setActivePanel("mobile")}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950"
              >
                <User className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"
              >
                {copy.login}
              </button>
            )}
          </div>
        </nav>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(nextUser) => setUser(nextUser)}
        />

        {activePanel === "settings" && (
          <SettingsPanel
            copy={copy}
            settings={settings}
            onClose={() => setActivePanel(null)}
            onApply={applySettings}
          />
        )}

        {activePanel === "property" && (
          <PropertyPanel
            copy={copy}
            user={user}
            onClose={() => setActivePanel(null)}
            onLogin={() => setIsAuthOpen(true)}
          />
        )}

        {activePanel === "wishlist" && (
          <WishlistPanel copy={copy} onClose={() => setActivePanel(null)} />
        )}

        {activePanel === "trips" && (
          <MyTripsPanel copy={copy} onClose={() => setActivePanel(null)} />
        )}
      </div>
    </>
  );
}

function TopButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/20"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function UserMenu({ user, onLogout, logoutLabel }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-950 shadow-xl">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700">
        <User className="h-4 w-4" />
      </div>

      <div>
        <p className="max-w-[140px] truncate text-xs font-black">
          {user?.name || "Traveller"}
        </p>
        <p className="max-w-[140px] truncate text-[10px] font-bold text-slate-400">
          {user?.identifier}
        </p>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white"
        title={logoutLabel}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function ShellModal({ title, subtitle, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xl">
      <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 shadow-xl transition hover:scale-105"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 p-8 text-white lg:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur-xl">
              <Icon className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-4xl font-black tracking-[-0.065em]">
              {title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
              {subtitle}
            </p>
          </div>

          <div className="p-8 lg:p-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onApply, onClose, copy }) {
  const [draft, setDraft] = useState(settings);

  return (
    <ShellModal
      title={copy.settingsTitle}
      subtitle={copy.settingsSubtitle}
      icon={Globe}
      onClose={onClose}
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <p className="font-black text-slate-950">{copy.currency}</p>
          </div>

          <div className="grid gap-3">
            {CURRENCIES.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    currency,
                  }))
                }
                className={[
                  "rounded-2xl border px-5 py-4 text-left text-sm font-black",
                  draft.currency === currency
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Languages className="h-5 w-5 text-blue-600" />
            <p className="font-black text-slate-950">{copy.language}</p>
          </div>

          <div className="grid gap-3">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    language,
                  }))
                }
                className={[
                  "rounded-2xl border px-5 py-4 text-left text-sm font-black",
                  draft.language === language
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {language}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
        >
          {copy.apply}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          {copy.close}
        </button>
      </div>
    </ShellModal>
  );
}

function PropertyPanel({ onClose, user, onLogin, copy }) {
  const [form, setForm] = useState({
    property_name: "",
    city: "",
    property_type: "Hotel",
    contact: user?.identifier || "",
  });

  const [submitted, setSubmitted] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const existing = readJsonStorage("a2a_property_leads", []);

    localStorage.setItem(
      "a2a_property_leads",
      JSON.stringify([
        {
          ...form,
          id:
            window.crypto?.randomUUID?.() ||
            `property_${Date.now().toString()}`,
          created_at: new Date().toISOString(),
          user_identifier: user?.identifier || null,
        },
        ...existing,
      ]),
    );

    setSubmitted(true);
  }

  return (
    <ShellModal
      title={copy.propertyTitle}
      subtitle={copy.propertySubtitle}
      icon={Briefcase}
      onClose={onClose}
    >
      {!user && (
        <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
          <p className="font-black text-amber-900">{copy.loginRecommended}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
            {copy.loginRecommendedText}
          </p>

          <button
            type="button"
            onClick={onLogin}
            className="mt-4 rounded-full bg-amber-600 px-5 py-3 text-sm font-black text-white"
          >
            {copy.loginFirst}
          </button>
        </div>
      )}

      {submitted ? (
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-3xl font-black tracking-[-0.05em] text-emerald-950">
            {copy.propertySaved}
          </h3>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            {copy.propertySavedText}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <Field
            label={copy.propertyName}
            value={form.property_name}
            onChange={(value) => updateField("property_name", value)}
            placeholder="Ocean View Stay"
            required
          />

          <Field
            label={copy.city}
            value={form.city}
            onChange={(value) => updateField("city", value)}
            placeholder="Goa"
            required
          />

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              {copy.propertyType}
            </label>

            <select
              value={form.property_type}
              onChange={(event) =>
                updateField("property_type", event.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-950 outline-none"
            >
              <option>Hotel</option>
              <option>Homestay</option>
              <option>Villa</option>
              <option>Apartment</option>
              <option>Resort</option>
            </select>
          </div>

          <Field
            label={copy.contact}
            value={form.contact}
            onChange={(value) => updateField("contact", value)}
            placeholder="owner@example.com"
            required
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white md:col-span-2"
          >
            <Plus className="h-4 w-4" />
            {copy.submitProperty}
          </button>
        </form>
      )}
    </ShellModal>
  );
}

function WishlistPanel({ onClose, copy }) {
  const [items] = useState(() => readJsonStorage("a2a_wishlist", []));

  return (
    <ShellModal
      title={copy.wishlistTitle}
      subtitle={copy.wishlistSubtitle}
      icon={Heart}
      onClose={onClose}
    >
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id || item.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="font-black text-slate-950">{item.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {item.location}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyModalState
          title={copy.noSavedItems}
          text={copy.noSavedItemsText}
        />
      )}
    </ShellModal>
  );
}

function MyTripsPanel({ onClose, copy }) {
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrips() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/trip-plans?limit=10`);
        const body = await response.json();

        if (!response.ok || !body.success) {
          throw new Error(body.message || "Could not load trips.");
        }

        setTrips(body.data || []);
      } catch (loadError) {
        setError(loadError?.message || "Could not load trips.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTrips();
  }, []);

  return (
    <ShellModal
      title={copy.myTripsTitle}
      subtitle={copy.myTripsSubtitle}
      icon={Map}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : trips.length ? (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <div
              key={
                trip.plan_id || `${trip.source_city}-${trip.destination_city}`
              }
              className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xl font-black tracking-[-0.04em] text-slate-950">
                {trip.source_city} → {trip.destination_city}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {trip.start_date} to {trip.end_date}
              </p>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                {copy.savedPlan}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyModalState title={copy.noTrips} text={copy.noTripsText} />
      )}
    </ShellModal>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function EmptyModalState({ title, text }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <p className="text-2xl font-black tracking-[-0.05em] text-slate-950">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}