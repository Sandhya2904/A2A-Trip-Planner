import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Plane,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { requestOtp, verifyOtp } from "../api/authApi";

const TEXT = {
  English: {
    brand: "A2A Trip",
    tagline: "INTELLIGENT TRAVEL PLANNER",
    requestEyebrow: "LOG IN OR REGISTER",
    requestTitle: "Access your premium travel account",
    requestSubtitle:
      "Sign in with your email to save trips, manage wishlists, review previous plans and continue from where you left off.",
    nameLabel: "YOUR NAME",
    emailLabel: "EMAIL ADDRESS",
    continueButton: "CONTINUE",
    requestPlaceholderName: "Your name",
    requestPlaceholderEmail: "you@example.com",

    verifyEyebrow: "OTP VERIFICATION",
    verifyTitle: "Check your email and continue",
    verifySubtitle:
      "We sent a real OTP to your email address. Enter the code below to securely continue into your travel workspace.",
    otpLabel: "ENTER OTP",
    otpPlaceholder: "000000",
    verifyButton: "VERIFY AND CONTINUE",
    resendButton: "RESEND OTP",
    changeEmailButton: "CHANGE EMAIL",

    securePill: "REAL EMAIL OTP",
    secureSubPill: "SECURE LOGIN FLOW",

    expiresText: "OTP expires in 5 minutes.",
    successSent: "OTP sent successfully to your email.",
    successResent: "OTP resent successfully.",
    invalidEmail: "Please enter a valid email address.",
    couldNotSend: "Could not send OTP.",
    couldNotVerify: "Could not verify OTP.",
    invalidOtp: "Invalid OTP.",
    couldNotResend: "Could not resend OTP.",

    sideBadge: "PREMIUM TRAVEL ACCESS",
    sideTitle: "Plan smarter. Save everything. Travel easier.",
    sideText:
      "One place for flights, hotels, tours, routes, budgets and saved journeys — designed to feel simple, premium and travel-first.",
    sideCard1Title: "Saved itineraries",
    sideCard1Text: "Continue planning without starting over",
    sideCard2Title: "Wishlist sync",
    sideCard2Text: "Keep your favorite stays and experiences",
    sideCard3Title: "Secure OTP access",
    sideCard3Text: "Fast email verification for real users",
  },

  Japanese: {
    tagline: "インテリジェント旅行プランナー",
    requestEyebrow: "ログインまたは登録",
    requestTitle: "プレミアム旅行アカウントへアクセス",
    requestSubtitle:
      "メールでログインして、旅行、ウィッシュリスト、過去のプランを保存し、続きから再開できます。",
    nameLabel: "お名前",
    emailLabel: "メールアドレス",
    continueButton: "続ける",
    requestPlaceholderName: "お名前",
    verifyEyebrow: "OTP認証",
    verifyTitle: "メールを確認して続行",
    verifySubtitle:
      "メールに本物のOTPを送信しました。下のコードを入力して続行してください。",
    otpLabel: "OTPを入力",
    verifyButton: "確認して続行",
    resendButton: "OTPを再送信",
    changeEmailButton: "メールを変更",
    sideBadge: "プレミアム旅行アクセス",
    sideTitle: "より賢く計画し、より簡単に旅する。",
  },

  Spanish: {
    tagline: "PLANIFICADOR INTELIGENTE DE VIAJES",
    requestEyebrow: "INICIAR SESIÓN O REGISTRARSE",
    requestTitle: "Accede a tu cuenta premium de viaje",
    requestSubtitle:
      "Inicia sesión con tu email para guardar viajes, listas de deseos y continuar donde lo dejaste.",
    nameLabel: "TU NOMBRE",
    emailLabel: "CORREO ELECTRÓNICO",
    continueButton: "CONTINUAR",
    requestPlaceholderName: "Tu nombre",
    verifyEyebrow: "VERIFICACIÓN OTP",
    verifyTitle: "Revisa tu correo y continúa",
    verifySubtitle:
      "Hemos enviado un OTP real a tu correo. Ingresa el código para continuar.",
    otpLabel: "INGRESA OTP",
    verifyButton: "VERIFICAR Y CONTINUAR",
    resendButton: "REENVIAR OTP",
    changeEmailButton: "CAMBIAR CORREO",
    sideBadge: "ACCESO PREMIUM DE VIAJE",
    sideTitle: "Planifica mejor. Guarda todo. Viaja más fácil.",
  },

  French: {
    tagline: "PLANIFICATEUR DE VOYAGE INTELLIGENT",
    requestEyebrow: "CONNEXION OU INSCRIPTION",
    requestTitle: "Accédez à votre compte voyage premium",
    requestSubtitle:
      "Connectez-vous avec votre email pour sauvegarder vos voyages, vos favoris et reprendre là où vous vous êtes arrêté.",
    nameLabel: "VOTRE NOM",
    emailLabel: "ADRESSE EMAIL",
    continueButton: "CONTINUER",
    requestPlaceholderName: "Votre nom",
    verifyEyebrow: "VÉRIFICATION OTP",
    verifyTitle: "Vérifiez votre email et continuez",
    verifySubtitle:
      "Nous avons envoyé un vrai OTP à votre adresse email. Saisissez-le ci-dessous.",
    otpLabel: "ENTRER OTP",
    verifyButton: "VÉRIFIER ET CONTINUER",
    resendButton: "RENVOYER OTP",
    changeEmailButton: "CHANGER L'EMAIL",
    sideBadge: "ACCÈS VOYAGE PREMIUM",
    sideTitle: "Planifiez mieux. Sauvegardez tout. Voyagez plus facilement.",
  },

  German: {
    tagline: "INTELLIGENTER REISEPLANER",
    requestEyebrow: "ANMELDEN ODER REGISTRIEREN",
    requestTitle: "Zugang zu deinem Premium-Reisekonto",
    requestSubtitle:
      "Melde dich mit deiner E-Mail an, um Reisen zu speichern, Wunschlisten zu verwalten und später fortzufahren.",
    nameLabel: "DEIN NAME",
    emailLabel: "E-MAIL-ADRESSE",
    continueButton: "WEITER",
    requestPlaceholderName: "Dein Name",
    verifyEyebrow: "OTP-VERIFIZIERUNG",
    verifyTitle: "Prüfe deine E-Mail und fahre fort",
    verifySubtitle:
      "Wir haben einen echten OTP-Code an deine E-Mail gesendet. Gib ihn unten ein.",
    otpLabel: "OTP EINGEBEN",
    verifyButton: "PRÜFEN UND WEITER",
    resendButton: "OTP ERNEUT SENDEN",
    changeEmailButton: "E-MAIL ÄNDERN",
    sideBadge: "PREMIUM-REISEZUGANG",
    sideTitle: "Besser planen. Alles speichern. Einfacher reisen.",
  },

  Arabic: {
    tagline: "مخطط سفر ذكي",
    requestEyebrow: "تسجيل الدخول أو التسجيل",
    requestTitle: "ادخل إلى حساب السفر المميز الخاص بك",
    requestSubtitle:
      "سجّل الدخول باستخدام بريدك الإلكتروني لحفظ الرحلات وإدارة المفضلة والمتابعة من حيث توقفت.",
    nameLabel: "اسمك",
    emailLabel: "البريد الإلكتروني",
    continueButton: "متابعة",
    requestPlaceholderName: "اسمك",
    verifyEyebrow: "التحقق عبر OTP",
    verifyTitle: "تحقق من بريدك الإلكتروني وتابع",
    verifySubtitle:
      "لقد أرسلنا رمز OTP حقيقيًا إلى بريدك الإلكتروني. أدخله أدناه للمتابعة.",
    otpLabel: "أدخل OTP",
    verifyButton: "تحقق وتابع",
    resendButton: "إعادة إرسال OTP",
    changeEmailButton: "تغيير البريد",
    sideBadge: "دخول سفر مميز",
    sideTitle: "خطط بذكاء. احفظ كل شيء. سافر بسهولة.",
  },

  Portuguese: {
    tagline: "PLANEJADOR INTELIGENTE DE VIAGENS",
    requestEyebrow: "ENTRAR OU REGISTRAR",
    requestTitle: "Acesse sua conta premium de viagem",
    requestSubtitle:
      "Entre com seu email para salvar viagens, favoritos e continuar de onde parou.",
    nameLabel: "SEU NOME",
    emailLabel: "ENDEREÇO DE EMAIL",
    continueButton: "CONTINUAR",
    requestPlaceholderName: "Seu nome",
    verifyEyebrow: "VERIFICAÇÃO OTP",
    verifyTitle: "Verifique seu email e continue",
    verifySubtitle:
      "Enviamos um OTP real para seu email. Digite abaixo para continuar.",
    otpLabel: "INSERIR OTP",
    verifyButton: "VERIFICAR E CONTINUAR",
    resendButton: "REENVIAR OTP",
    changeEmailButton: "ALTERAR EMAIL",
    sideBadge: "ACESSO PREMIUM DE VIAGEM",
    sideTitle: "Planeje melhor. Salve tudo. Viaje com mais facilidade.",
  },

  Chinese: {
    tagline: "智能旅行规划器",
    requestEyebrow: "登录或注册",
    requestTitle: "进入你的高级旅行账户",
    requestSubtitle:
      "使用邮箱登录，保存旅行、管理愿望清单，并从上次离开的地方继续。",
    nameLabel: "你的姓名",
    emailLabel: "邮箱地址",
    continueButton: "继续",
    requestPlaceholderName: "你的姓名",
    verifyEyebrow: "OTP 验证",
    verifyTitle: "检查你的邮箱并继续",
    verifySubtitle:
      "我们已向你的邮箱发送真实 OTP。请输入下方验证码继续。",
    otpLabel: "输入 OTP",
    verifyButton: "验证并继续",
    resendButton: "重新发送 OTP",
    changeEmailButton: "更改邮箱",
    sideBadge: "高级旅行访问",
    sideTitle: "更聪明地规划，保存一切，轻松出行。",
  },
};

function getCurrentLanguage() {
  try {
    const settings = JSON.parse(
      localStorage.getItem("a2a_travel_settings") || "{}",
    );
    return settings.language || "English";
  } catch {
    return "English";
  }
}

function getCopy(language) {
  return {
    ...TEXT.English,
    ...(TEXT[language] || {}),
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [language, setLanguage] = useState(getCurrentLanguage);
  const copy = useMemo(() => getCopy(language), [language]);

  const [step, setStep] = useState("request");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedIdentifier, setMaskedIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleSettingsChanged(event) {
      setLanguage(event.detail?.language || getCurrentLanguage());
    }

    window.addEventListener("a2a_settings_changed", handleSettingsChanged);

    return () => {
      window.removeEventListener("a2a_settings_changed", handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        resetAndClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleRequestOtp(event) {
    event.preventDefault();

    const cleanEmail = identifier.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setError(copy.invalidEmail);
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await requestOtp({
        identifier: cleanEmail,
        name,
      });

      if (!response.success) {
        setError(response.message || copy.couldNotSend);
        return;
      }

      setIdentifier(cleanEmail);
      setMaskedIdentifier(response.masked_identifier || cleanEmail);
      setMessage(response.message || copy.successSent);
      setStep("verify");
    } catch (requestError) {
      setError(requestError?.message || copy.couldNotSend);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await verifyOtp({
        identifier,
        otp,
        name,
      });

      if (!response.success) {
        setError(response.message || copy.invalidOtp);
        return;
      }

      localStorage.setItem("a2a_auth_token", response.token);
      localStorage.setItem("a2a_user", JSON.stringify(response.user));

      window.dispatchEvent(
        new CustomEvent("a2a_auth_changed", {
          detail: response.user,
        }),
      );

      onSuccess?.(response.user);
      resetLocalState();
      onClose?.();
    } catch (verifyError) {
      setError(verifyError?.message || copy.couldNotVerify);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!identifier) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await requestOtp({
        identifier,
        name,
      });

      if (!response.success) {
        setError(response.message || copy.couldNotResend);
        return;
      }

      setMaskedIdentifier(response.masked_identifier || identifier);
      setMessage(response.message || copy.successResent);
    } catch (requestError) {
      setError(requestError?.message || copy.couldNotResend);
    } finally {
      setIsLoading(false);
    }
  }

  function resetLocalState() {
    setStep("request");
    setName("");
    setIdentifier("");
    setOtp("");
    setMaskedIdentifier("");
    setMessage("");
    setError("");
    setIsLoading(false);
  }

  function resetAndClose() {
    resetLocalState();
    onClose?.();
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1600px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(0,0,0,0.45)] lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
          <section className="relative bg-[#f8f6f2] px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-10 xl:px-16">
            <button
              type="button"
              onClick={resetAndClose}
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white/80 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Close login page"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-slate-400 text-slate-800">
                <Plane className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[2rem] font-black leading-none tracking-[-0.07em] text-slate-950">
                  {copy.brand}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  {copy.tagline}
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-14 xl:mt-16">
              {step === "request" ? (
                <div className="mx-auto w-full max-w-[560px]">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    {copy.requestEyebrow}
                  </p>

                  <h1 className="mt-5 max-w-[11ch] text-[2.65rem] font-black leading-[0.94] tracking-[-0.07em] text-slate-950 sm:text-[3.2rem] lg:text-[3.6rem]">
                    {copy.requestTitle}
                  </h1>

                  <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-8 text-slate-600">
                    {copy.requestSubtitle}
                  </p>

                  <form onSubmit={handleRequestOtp} className="mt-8 space-y-6">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {copy.nameLabel}
                      </label>

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <User className="h-5 w-5 text-slate-400" />
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder={copy.requestPlaceholderName}
                          className="w-full bg-transparent text-[15px] font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {copy.emailLabel}
                      </label>

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <input
                          type="email"
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          placeholder={copy.requestPlaceholderEmail}
                          required
                          className="w-full bg-transparent text-[15px] font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
                        {error}
                      </div>
                    ) : null}

                    {message ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold leading-6 text-emerald-700">
                        {message}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="h-4 w-4" />
                      )}
                      {copy.continueButton}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[560px]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setOtp("");
                      setError("");
                      setMessage("");
                    }}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-950"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {copy.changeEmailButton}
                  </button>

                  <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    {copy.verifyEyebrow}
                  </p>

                  <h1 className="mt-5 max-w-[11ch] text-[2.6rem] font-black leading-[0.94] tracking-[-0.07em] text-slate-950 sm:text-[3rem] lg:text-[3.35rem]">
                    {copy.verifyTitle}
                  </h1>

                  <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-8 text-slate-600">
                    {copy.verifySubtitle}
                  </p>

                  <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {maskedIdentifier}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {copy.expiresText}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="mt-7 space-y-6">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {copy.otpLabel}
                      </label>

                      <input
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        placeholder={copy.otpPlaceholder}
                        required
                        inputMode="numeric"
                        maxLength={8}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center text-3xl font-black tracking-[0.45em] text-slate-950 outline-none placeholder:tracking-[0.2em] placeholder:text-slate-300"
                      />
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold leading-6 text-red-700">
                        {error}
                      </div>
                    ) : null}

                    {message ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold leading-6 text-emerald-700">
                        {message}
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {copy.verifyButton}
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {copy.resendButton}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3 lg:mt-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                {copy.securePill}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {copy.secureSubPill}
              </div>
            </div>
          </section>

          <section className="relative hidden min-h-[780px] overflow-hidden bg-slate-950 lg:block">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=90"
              alt="Premium travel destination"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-950/15 to-blue-900/45" />

            <div className="absolute left-8 top-8 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-xl">
              {copy.sideBadge}
            </div>

            <div className="absolute bottom-10 left-8 right-8">
              <div className="max-w-2xl">
                <h2 className="max-w-[13ch] text-[2.5rem] font-black leading-[0.96] tracking-[-0.06em] text-white xl:text-[3.2rem]">
                  {copy.sideTitle}
                </h2>

                <p className="mt-4 max-w-[620px] text-[15px] font-medium leading-8 text-slate-100/95">
                  {copy.sideText}
                </p>
              </div>

              <div className="mt-8 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/20 bg-white/12 p-5 backdrop-blur-xl">
                  <p className="text-sm font-black text-white">
                    {copy.sideCard1Title}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-100/90">
                    {copy.sideCard1Text}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/20 bg-white/12 p-5 backdrop-blur-xl">
                  <p className="text-sm font-black text-white">
                    {copy.sideCard2Title}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-100/90">
                    {copy.sideCard2Text}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/20 bg-white/12 p-5 backdrop-blur-xl">
                  <p className="text-sm font-black text-white">
                    {copy.sideCard3Title}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-100/90">
                    {copy.sideCard3Text}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}