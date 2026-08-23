"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MAX_SCREENSHOT_BYTES,
  ORDER_TIMEOUT_MS,
  allowedScreenshotTypes,
  resolveCatalogSelection,
  resolveProductIdFromText,
  selectionLabel,
} from "@/services/order";
import { isAskPricePlan } from "@/services/catalog";
import type { CatalogData, CatalogSettings } from "@/types/catalog";
import { HapticSwitch } from "@/components/common/HapticSwitch";
import { Icon } from "@/components/common/Icon";
import { vibrate } from "@/lib/haptics";

type SubmitResult =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; orderId: string; fbLink: string }
  | {
      status: "error";
      kind:
        | "missing-file"
        | "file-too-large"
        | "unsupported-file"
        | "missing-fields"
        | "bad-phone"
        | "delivery"
        | "timeout"
        | "generic";
    };

export type OrderFormCardProps = {
  /**
   * The build-time catalog, kept separate from the live one so the prefilled
   * product text stays stable while a background refresh lands.
   */
  initialCatalog: CatalogData;
  /** The one live catalog `CheckoutFlow` resolves for the whole step. */
  catalog: CatalogData;
  productId: string | null;
  planId: string | null;
  onDone: (done: boolean) => void;
  /**
   * Fired the moment the customer puts anything into this form. The step above
   * uses it to stop swapping the form out for a stock notice once there is
   * work — or a submitted order — to lose.
   */
  onEngaged?: () => void;
  /**
   * The platform whose QR the customer actually scanned, used as the payment
   * field's value until they pick something else themselves. Without it the
   * two controls can disagree and the admin receives a screenshot that does
   * not match the declared method.
   */
  defaultPayment?: string;
  /**
   * The step above's view of engagement, which is wider than this card's own:
   * scanning a QR counts, and that customer may already have transferred. It
   * is ORed with the local latch so an availability change can never leave
   * them with no way to send the proof.
   */
  engaged?: boolean;
  /**
   * True when the payment step renders above this card and has already shown
   * the Ask Price notice — this card must not repeat it.
   */
  askPriceHandledAbove?: boolean;
  /** `h2` where the page already carries its own `h1` above the card. */
  headingLevel?: "h1" | "h2";
};

const MAIL_REQUIRED_PRODUCTS = new Set(["zoom", "canva", "duolingo"]);
/**
 * Products whose order cannot be fulfilled without the SIM number the data is
 * loaded onto. Mirrored server-side in `functions/api/order.js` — a client-side
 * `required` is not a validation. Keep the two lists in step, and note that
 * `resolveProductIdFromText` in `src/services/order.ts` is what makes a
 * hand-typed "Atom 24GB" resolve to an id in this set.
 */
const PHONE_REQUIRED_PRODUCTS = new Set(["atom-data", "mytel-data"]);
const GEMINI_PRODUCT_ID = "gemini";
const GEMINI_LINK_PLAN_ID = "18_months";
const FILE_IDLE_TEXT = "Screenshot ရွေးရန် နှိပ်ပါ";
/**
 * The same free-text rule the server applies in `functions/api/order.js`.
 * It MUST be checked here too: the server gates on this text as well as on
 * `product_id`, and `resolveProductIdFromText` returns on the first catalog
 * NAME match before it reaches its atom/mytel fallbacks — so "Tidal + Mytel
 * 22GB" resolves to `tidal`. Without this clause the field would be hidden
 * while the server demanded it, and the customer, who has already transferred
 * the money, would get a 400 with nothing on screen left to fill in.
 */
const PHONE_REQUIRED_TEXT = /\b(atom|mytel)\b/i;
/** The Myanmar-mobile half of the contact rule, reused by the SIM field. */
const MM_PHONE_PATTERN = "09\\d{7,9}";
const CONTACT_PATTERN =
  `${MM_PHONE_PATTERN}|\\+?95\\d{7,10}|@?[A-Za-z0-9_]{4,32}`;

function errorKind(message: string, name: string): Extract<SubmitResult, { status: "error" }> ["kind"] {
  if (name === "AbortError") return "timeout";
  if (message.includes("Unsupported image type")) return "unsupported-file";
  if (message.includes("File too large")) return "file-too-large";
  if (message.includes("Screenshot required")) return "missing-file";
  if (message.includes("Invalid phone")) return "bad-phone";
  if (message.includes("Missing fields")) return "missing-fields";
  if (message.includes("Delivery failed")) return "delivery";
  return "generic";
}

function ErrorMessage({ kind }: { kind: Extract<SubmitResult, { status: "error" }> ["kind"] }) {
  const fallback = (
    <>
      {" "}(သို့) Telegram Bot{" "}
      <a href="https://t.me/PSNamso_bot" target="_blank" rel="noopener noreferrer">
        @PSNamso_bot
      </a>{" "}
      (သို့){" "}
      <a
        href="https://www.messenger.com/t/happyyou2020"
        target="_blank"
        rel="noopener noreferrer"
      >
        Page Messenger
      </a>{" "}
      ကနေ ဆက်သွယ်နိုင်ပါတယ်။
    </>
  );

  if (kind === "missing-file") {
    return (
      <>ငွေလွှဲ Screenshot ရွေးပေးပါဦး — အပေါ်က “{FILE_IDLE_TEXT}” ကိုနှိပ်ပြီး ပုံရွေးပါ။</>
    );
  }
  if (kind === "file-too-large") {
    return <>Screenshot ဖိုင်က 8MB ထက်ကြီးနေပါတယ်။ ပိုသေးတဲ့ပုံ ပြန်ရွေးပေးပါ။</>;
  }
  if (kind === "unsupported-file") {
    return (
      <>
        ဒီ screenshot ဖိုင်အမျိုးအစားကို လက်မခံပါ။ ပုံကို <strong>JPG / PNG</strong>{" "}
        အနေနဲ့ ပြန်သိမ်းပြီး (iPhone ဆိုရင် screenshot ကို Photos ထဲကနေ share → save
        အသစ်လုပ်ပြီး) ထပ်တင်ပေးပါ။
      </>
    );
  }
  if (kind === "missing-fields") {
    return <>လိုအပ်တဲ့ အချက်အလက် မပြည့်စုံသေးပါ — * ပါတဲ့ အကွက်အားလုံး ဖြည့်ပေးပါ။</>;
  }
  if (kind === "bad-phone") {
    return (
      <>
        Data ထည့်မည့် ဖုန်းနံပါတ်ကို <strong>09xxxxxxxxx</strong> ပုံစံဖြင့်
        ပြန်ရေးပေးပါ။{fallback}
      </>
    );
  }
  if (kind === "delivery") {
    return <>Order က Admin ဆီ မရောက်သေးပါ။ ခဏနေ ထပ်ကြိုးစားပါ{fallback}</>;
  }
  if (kind === "timeout") {
    return (
      <>
        Order ပို့တာ အချိန်ကြာနေလို့ ရပ်လိုက်ပါတယ်။{" "}
        <strong>Order က ရောက်နှင့်ပြီး ဖြစ်နေနိုင်ပါတယ်</strong> — ထပ်မတင်ခင် အောက်က
        လမ်းကြောင်းတစ်ခုကနေ Admin ကို အရင် စစ်ပေးပါ။{fallback}
      </>
    );
  }
  return <>Order ပို့မရသေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ{fallback}</>;
}

/**
 * Step 3. Nothing else survives here on purpose: the product summary, the QR
 * and the form all describe an order that has already been sent, and leaving
 * them on screen invites a second one.
 */
function OrderDoneCard({
  result,
  settings,
  panelRef,
  headingLevel,
}: {
  result: Extract<SubmitResult, { status: "success" }>;
  settings: CatalogSettings;
  panelRef: RefObject<HTMLDivElement | null>;
  headingLevel: "h1" | "h2";
}) {
  // This card replaces the form, so it also inherits its place in the document
  // outline — on /order/ it is the page's only heading.
  const Heading = headingLevel;
  return (
    <section
      className="order-form-card-next order-form-card-next--done"
      aria-labelledby="order-done-title"
    >
      <div
        className="order-result order-result--success"
        role="status"
        ref={panelRef}
      >
        <Heading id="order-done-title" className="order-result__title">
          ✓ Order တင်ပြီးပါပြီ!
        </Heading>
        <p>
          Order ID: <strong>{result.orderId}</strong>
        </p>
        <p>
          Admin က သင့် Viber (သို့) Telegram ကနေ မကြာခင် ဆက်သွယ်ပြီး Account
          ပို့ပေးပါမယ်။
        </p>
        <p>မေးစရာရှိရင် Order ID နဲ့ ဆက်သွယ်ပါ။</p>
        <div className="order-result__actions">
          <a
            className="button button--primary button--md"
            href={settings.telegramChannel || "https://t.me/Premiumstorezz"}
            target="_blank"
            rel="noopener noreferrer"
            data-haptic="light"
          >
            Telegram
          </a>
          <a
            className="button button--secondary button--md"
            href={result.fbLink}
            target="_blank"
            rel="noopener noreferrer"
            data-haptic="light"
          >
            Page Messenger
          </a>
        </div>
      </div>
    </section>
  );
}

export function OrderFormCard({
  initialCatalog,
  catalog,
  productId,
  planId,
  onDone,
  onEngaged,
  defaultPayment = "",
  engaged = false,
  askPriceHandledAbove = false,
  headingLevel = "h1",
}: OrderFormCardProps) {
  const Heading = headingLevel;
  const initialSelection = useMemo(
    () => resolveCatalogSelection(initialCatalog, productId, planId),
    [initialCatalog, planId, productId],
  );
  const liveSelection = resolveCatalogSelection(catalog, productId, planId);
  const prefillSelection = liveSelection ?? initialSelection;
  const initialProductText = initialSelection ? selectionLabel(initialSelection) : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [productText, setProductText] = useState(initialProductText);
  const [prefillActive, setPrefillActive] = useState(Boolean(initialSelection));
  const [customerMail, setCustomerMail] = useState("");
  const [customerPw, setCustomerPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [payment, setPayment] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });
  // Mirrors what `onEngaged` reports upward, because this card has its own
  // reason to care: the Ask Price guard below reads the LIVE catalog, and once
  // there is typed input, a chosen screenshot or a sent order on screen, no
  // catalogue change may take the form away.
  const [touched, setTouched] = useState(false);

  const markEngaged = () => {
    setTouched(true);
    onEngaged?.();
  };

  // Drives the Done step of the checkout rail, which lives one level up so it
  // can render above the summary card.
  useEffect(() => {
    onDone(result.status === "success");
  }, [onDone, result.status]);

  // Outcome haptic, plus bringing the outcome into view — on a phone both the
  // success panel and the error panel render below a form taller than the
  // screen. `result` (not `result.status`) is the dependency on purpose: every
  // setResult produces a new object, so a second failed attempt buzzes again
  // instead of staying silent.
  useEffect(() => {
    if (result.status !== "success" && result.status !== "error") return;
    vibrate(result.status === "success" ? "success" : "error");
    resultRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [result]);

  const activePrefill = prefillActive ? prefillSelection : null;
  const currentProductId = activePrefill
    ? activePrefill.product.id
    : resolveProductIdFromText(catalog, productText);
  const prefilledPlanId = activePrefill?.plan?.id ?? "";
  const planNeedsMail = prefillActive && prefilledPlanId.includes("cus_mail");
  const mailRequired = MAIL_REQUIRED_PRODUCTS.has(currentProductId) || planNeedsMail;
  const phoneRequired =
    PHONE_REQUIRED_PRODUCTS.has(currentProductId) ||
    PHONE_REQUIRED_TEXT.test(productText);
  const geminiNeedsCredentials =
    currentProductId === GEMINI_PRODUCT_ID &&
    (prefillActive
      ? prefilledPlanId !== GEMINI_LINK_PLAN_ID
      : !productText.toLowerCase().includes("18 month") &&
        !productText.toLowerCase().includes("link"));
  const showMailField = mailRequired || geminiNeedsCredentials;
  const showPasswordField = geminiNeedsCredentials;
  const showOutOfStock = prefillActive && activePrefill?.plan?.stock === false;

  if (result.status === "success") {
    return (
      <OrderDoneCard
        result={result}
        settings={catalog.settings}
        panelRef={resultRef}
        headingLevel={headingLevel}
      />
    );
  }

  if (
    activePrefill?.plan &&
    isAskPricePlan(activePrefill.plan) &&
    !touched &&
    !engaged
  ) {
    if (askPriceHandledAbove) return null;
    return (
      <section className="order-form-card-next checkout-unavailable" role="status">
        <Heading id="order-form-title"><Icon name="file" />Order မတင်ခင် မေးပေးပါ</Heading>
        <p>ဒီ plan အတွက် ငွေမလွှဲခင် လက်ရှိစျေးနှုန်းနဲ့ order availability ကို Admin ကို အရင်မေးပေးပါ။</p>
        <div className="plan-contact-row">
          <a
            className="button button--primary button--md"
            href={catalog.settings.telegramChannel || "https://t.me/Premiumstorezz"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on Telegram
          </a>
          <a
            className="button button--secondary button--md"
            href={catalog.settings.facebookPage || "https://www.messenger.com/t/happyyou2020"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
        </div>
      </section>
    );
  }

  const updateProduct = (value: string) => {
    setProductText(value);
    const restoredPrefill = Boolean(
      initialSelection && value.trim() === initialProductText.trim(),
    );
    setPrefillActive(restoredPrefill);

    const nextProductId = restoredPrefill
      ? initialSelection?.product.id ?? ""
      : resolveProductIdFromText(catalog, value);
    const nextPlanId = restoredPrefill ? initialSelection?.plan?.id ?? "" : "";
    const nextNeedsMail =
      MAIL_REQUIRED_PRODUCTS.has(nextProductId) || nextPlanId.includes("cus_mail");
    const nextNeedsPhone =
      PHONE_REQUIRED_PRODUCTS.has(nextProductId) ||
      PHONE_REQUIRED_TEXT.test(value);
    const nextNeedsGeminiCredentials =
      nextProductId === GEMINI_PRODUCT_ID &&
      (restoredPrefill
        ? nextPlanId !== GEMINI_LINK_PLAN_ID
        : !value.toLowerCase().includes("18 month") &&
          !value.toLowerCase().includes("link"));

    if (!nextNeedsPhone) setPhone("");
    if (!nextNeedsMail && !nextNeedsGeminiCredentials) setCustomerMail("");
    if (!nextNeedsGeminiCredentials) {
      setCustomerPw("");
      setShowPassword(false);
    }
  };

  const updateFile = (event: ChangeEvent<HTMLInputElement>) => {
    markEngaged();
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (result.status === "error") setResult({ status: "idle" });
  };

  // Editing the form after an outcome starts a fresh attempt: the success
  // panel and the rail's Done step both belong to the order that was already
  // sent, and leaving them up would mark an unsubmitted second order as done.
  const clearOutcome = (event: FormEvent<HTMLFormElement>) => {
    // The iOS haptic overlay is an unnamed checkbox inside this form, and its
    // toggle fires a bubbling `input` event that is NOT the customer editing
    // anything. It arrives after the submit handler has run, so without this
    // guard a screenshot-missing error would be raised and then wiped in the
    // same tap and the customer would see no explanation at all.
    const target = event.target;
    if (target instanceof Element && target.classList.contains("haptic-tap")) {
      return;
    }
    markEngaged();
    setResult((current) =>
      current.status === "success" || current.status === "error"
        ? { status: "idle" }
        : current,
    );
  };

  const resetForm = () => {
    setName("");
    setProductText("");
    setPrefillActive(false);
    setCustomerMail("");
    setCustomerPw("");
    setShowPassword(false);
    setPayment("");
    setPhone("");
    setContact("");
    setNote("");
    setHoneypot("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markEngaged();
    const form = event.currentTarget;

    if (!file) {
      setResult({ status: "error", kind: "missing-file" });
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setResult({ status: "error", kind: "file-too-large" });
      return;
    }
    const fileType = file.type.toLowerCase().split(";")[0].trim();
    if (fileType && !allowedScreenshotTypes.has(fileType)) {
      setResult({ status: "error", kind: "unsupported-file" });
      return;
    }

    setResult({ status: "submitting" });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ORDER_TIMEOUT_MS);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        body: new FormData(form),
        signal: controller.signal,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        orderId?: string;
        fbLink?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "failed");
      }

      const fbLink =
        typeof payload.fbLink === "string" && /^https:\/\//.test(payload.fbLink)
          ? payload.fbLink
          : "#";
      setResult({
        status: "success",
        orderId: String(payload.orderId ?? ""),
        fbLink,
      });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const name = error instanceof Error ? error.name : "";
      setResult({ status: "error", kind: errorKind(message, name) });
    } finally {
      window.clearTimeout(timer);
    }
  };

  return (
    <section className="order-form-card-next" aria-labelledby="order-form-title">
      <Heading id="order-form-title"><Icon name="file" />Order တင်ရန်</Heading>
      {/* A customer reading this has already transferred money. Anything that
          reads as "or do something else instead" belongs before that point,
          not here — say what to do and what happens next. */}
      <p className="order-form-card-next__intro">
        အချက်အလက်ဖြည့်ပြီး ငွေလွှဲ screenshot တင်ပါ။ Admin က သင့်{" "}
        <strong>Viber (သို့) Telegram</strong> ကနေ Account ပို့ပေးပါမယ်။
      </p>

      <form onSubmit={submitOrder} onInput={clearOutcome}>
        <input
          type="hidden"
          name="product_id"
          value={activePrefill?.product.id ?? ""}
        />
        <input type="hidden" name="plan_id" value={prefilledPlanId} />

        <div className="order-field">
          <label htmlFor="order-name">နာမည် *</label>
          <input
            id="order-name"
            name="name"
            type="text"
            required
            maxLength={60}
            placeholder="သင့်နာမည်"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="order-field">
          <label htmlFor="order-product">ဝယ်ယူလိုသည့် ပစ္စည်း *</label>
          <input
            id="order-product"
            name="product"
            type="text"
            required
            maxLength={120}
            placeholder="ဥပမာ - Netflix 1 Month"
            value={productText}
            onChange={(event) => updateProduct(event.target.value)}
            aria-describedby={showOutOfStock ? "order-stock-warning" : undefined}
          />
          {showOutOfStock ? (
            <p id="order-stock-warning" className="order-stock-warning" role="alert">
              သတိပြုရန် — ဒီ plan က လောလောဆယ် stock မရှိပါ။ Order တင်ထားရင် stock
              ပြန်ရှိချိန် Admin က အကြောင်းပြန်ပါမယ်။
            </p>
          ) : null}
        </div>

        {/* Kept mounted and only `hidden`, like the mail field: the value stays
            in the FormData contract, and `required`/`pattern` are bound to the
            requirement rather than the visibility. A `required` or `pattern` on
            a hidden input Chrome cannot focus dead-ends the whole submit with
            "an invalid form control is not focusable". */}
        <div className="order-field" hidden={!phoneRequired}>
          <label htmlFor="order-phone">Data ထည့်မည့် ဖုန်းနံပါတ် *</label>
          <input
            id="order-phone"
            name="phone"
            type={phoneRequired ? "tel" : "text"}
            required={phoneRequired}
            maxLength={20}
            inputMode="numeric"
            placeholder="09xxxxxxxxx"
            autoComplete={phoneRequired ? "tel" : "off"}
            pattern={phoneRequired ? MM_PHONE_PATTERN : undefined}
            title="Data ထည့်ပေးရမည့် နံပါတ်ကို 09xxxxxxxxx ပုံစံဖြင့် ရေးပါ"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <p className="order-field__hint">
            Data ထည့်ပေးမည့် နံပါတ်ကို အတိအကျ ရေးပါ။ အောက်က Contact နဲ့
            မတူညီလည်း ရပါတယ် — Contact က ပြန်ဆက်သွယ်ရန်၊ ဒါက data ဝင်မည့် SIM ပါ။
          </p>
        </div>

        <div className="order-field" hidden={!showMailField}>
          <label htmlFor="order-mail">
            {mailRequired ? "Upgrade လုပ်မည့် သင့် Email *" : "Gmail (optional)"}
          </label>
          <input
            id="order-mail"
            name="customer_mail"
            /* While this field is hidden, a leftover value still fails email
               validation, and Chrome then refuses to submit with "an invalid
               form control is not focusable" — a dead end the customer cannot
               see or fix. Dropping to `text` while hidden keeps the value and
               the multipart contract intact and only skips the format check. */
            type={showMailField ? "email" : "text"}
            required={mailRequired}
            maxLength={120}
            placeholder="yourname@gmail.com"
            autoComplete="off"
            value={customerMail}
            onChange={(event) => setCustomerMail(event.target.value)}
          />
          <p className="order-field__hint">
            {mailRequired
              ? "ဒီ product က သင့် mail ပေါ်မှာ တင်ပေးရတာမို့ Email ဖြည့်ပေးပါ။"
              : "Gemini က သင့် Gmail + Password နဲ့ တင်ပေးရပါတယ်။ အခုမဖြည့်ချင်ရင် Admin ဆက်သွယ်လာချိန် ပေးလို့ရပါတယ်။"}
          </p>
        </div>

        <div className="order-field" hidden={!showPasswordField}>
          <label htmlFor="order-password">Gmail Password (optional)</label>
          <input
            id="order-password"
            name="customer_pw"
            type={showPassword ? "text" : "password"}
            maxLength={100}
            placeholder="Gmail password"
            autoComplete="off"
            value={customerPw}
            onChange={(event) => setCustomerPw(event.target.value)}
          />
          <label className="order-check" htmlFor="order-show-password">
            <input
              id="order-show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Password ပြရန်
          </label>
        </div>

        <div className="order-field">
          <label htmlFor="order-payment">ငွေလွှဲထားသည့် နည်းလမ်း *</label>
          <select
            id="order-payment"
            name="payment"
            required
            /* The scanned platform wins until the customer chooses for
               themselves; after that their own choice sticks. */
            value={payment || defaultPayment}
            onChange={(event) => setPayment(event.target.value)}
          >
            <option value="">ရွေးပါ</option>
            <option>KBZ Pay</option>
            <option>Wave Pay</option>
            <option>AYA Pay</option>
            <option>Other</option>
          </select>
        </div>

        <div className="order-field">
          <label htmlFor="order-contact">
            ပြန်ဆက်သွယ်ရန် Viber နံပါတ် သို့မဟုတ် Telegram Username *
          </label>
          <input
            id="order-contact"
            name="contact"
            type="text"
            required
            maxLength={40}
            placeholder="09xxxxxxxxx (သို့) @username"
            autoComplete="off"
            pattern={CONTACT_PATTERN}
            title="Viber နံပါတ် (09xxxxxxxxx) သို့မဟုတ် Telegram username (@username) ဖြည့်ပေးပါ"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
          />
        </div>

        <div className="order-field">
          <span className="order-field__label">ငွေလွှဲ Screenshot *</span>
          <input
            ref={fileInputRef}
            className="order-file-input"
            id="order-screenshot"
            name="screenshot"
            type="file"
            accept="image/*"
            onChange={updateFile}
          />
          {/* No overlay switch here: this label's job is to activate the file
              input, and an interactive child would become the activation
              target and stop the picker from opening. */}
          <label
            className={file ? "order-file order-file--selected" : "order-file"}
            htmlFor="order-screenshot"
            data-haptic="light"
          >
            <span aria-hidden="true">▣</span>
            <span>{file?.name || FILE_IDLE_TEXT}</span>
          </label>
          <p className="order-field__hint order-field__hint--file">JPG, PNG, WebP နှင့် mobile image များ — အများဆုံး 8MB</p>
        </div>

        <div className="order-field">
          <label htmlFor="order-note">မှတ်ချက် (optional)</label>
          <textarea
            id="order-note"
            name="note"
            rows={2}
            maxLength={300}
            placeholder="ထပ်ဖြည့်ပြောချင်တာရှိရင် ရေးပါ"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <input
          className="order-honeypot"
          type="text"
          name="extra_field_hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />

        <button
          className="button button--primary order-submit"
          type="submit"
          data-haptic="medium"
          disabled={result.status === "submitting"}
        >
          {result.status === "submitting" ? "ပို့နေသည်…" : "Order တင်မယ်"}
          {/* `submit` mode: on iOS the tap lands on the overlay switch, which
              would otherwise become the activation target and silently cancel
              the submission. It re-runs `requestSubmit()` on this button. */}
          <HapticSwitch mode="submit" />
        </button>
      </form>

      {result.status === "error" ? (
        <div
          className="order-result order-result--error"
          role="alert"
          ref={resultRef}
        >
          <ErrorMessage kind={result.kind} />
        </div>
      ) : null}
    </section>
  );
}
