"use client";

import { useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCatalog } from "@/hooks/useCatalog";
import {
  MAX_SCREENSHOT_BYTES,
  ORDER_TIMEOUT_MS,
  allowedScreenshotTypes,
  resolveCatalogSelection,
  resolveProductIdFromText,
  selectionLabel,
} from "@/services/order";
import { isAskPricePlan } from "@/services/catalog";
import type { CatalogData } from "@/types/catalog";
import { Icon } from "@/components/common/Icon";

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
        | "delivery"
        | "timeout"
        | "generic";
    };

type OrderFormProps = {
  initialCatalog: CatalogData;
};

type OrderFormStateProps = OrderFormProps & {
  productId: string | null;
  planId: string | null;
};

const MAIL_REQUIRED_PRODUCTS = new Set(["zoom", "canva", "duolingo"]);
const GEMINI_PRODUCT_ID = "gemini";
const GEMINI_LINK_PLAN_ID = "18_months";
const FILE_IDLE_TEXT = "Screenshot ရွေးရန် နှိပ်ပါ";
const CONTACT_PATTERN =
  "09\\d{7,9}|\\+?95\\d{7,10}|@?[A-Za-z0-9_]{4,32}";

function errorKind(message: string, name: string): Extract<SubmitResult, { status: "error" }> ["kind"] {
  if (name === "AbortError") return "timeout";
  if (message.includes("Unsupported image type")) return "unsupported-file";
  if (message.includes("File too large")) return "file-too-large";
  if (message.includes("Screenshot required")) return "missing-file";
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

function OrderFormState({ initialCatalog, productId, planId }: OrderFormStateProps) {
  const { catalog = initialCatalog } = useCatalog(initialCatalog);
  const initialSelection = useMemo(
    () => resolveCatalogSelection(initialCatalog, productId, planId),
    [initialCatalog, planId, productId],
  );
  const liveSelection = resolveCatalogSelection(catalog, productId, planId);
  const prefillSelection = liveSelection ?? initialSelection;
  const initialProductText = initialSelection ? selectionLabel(initialSelection) : "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [productText, setProductText] = useState(initialProductText);
  const [prefillActive, setPrefillActive] = useState(Boolean(initialSelection));
  const [customerMail, setCustomerMail] = useState("");
  const [customerPw, setCustomerPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [payment, setPayment] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });

  const activePrefill = prefillActive ? prefillSelection : null;
  const currentProductId = activePrefill
    ? activePrefill.product.id
    : resolveProductIdFromText(catalog, productText);
  const prefilledPlanId = activePrefill?.plan?.id ?? "";
  const planNeedsMail = prefillActive && prefilledPlanId.includes("cus_mail");
  const mailRequired = MAIL_REQUIRED_PRODUCTS.has(currentProductId) || planNeedsMail;
  const geminiNeedsCredentials =
    currentProductId === GEMINI_PRODUCT_ID &&
    (prefillActive
      ? prefilledPlanId !== GEMINI_LINK_PLAN_ID
      : !productText.toLowerCase().includes("18 month") &&
        !productText.toLowerCase().includes("link"));
  const showMailField = mailRequired || geminiNeedsCredentials;
  const showPasswordField = geminiNeedsCredentials;
  const showOutOfStock = prefillActive && activePrefill?.plan?.stock === false;

  if (activePrefill?.plan && isAskPricePlan(activePrefill.plan)) {
    return (
      <section className="order-form-card-next checkout-unavailable" role="status">
        <h1 id="order-form-title"><Icon name="file" />Order မတင်ခင် မေးပေးပါ</h1>
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
    const nextNeedsGeminiCredentials =
      nextProductId === GEMINI_PRODUCT_ID &&
      (restoredPrefill
        ? nextPlanId !== GEMINI_LINK_PLAN_ID
        : !value.toLowerCase().includes("18 month") &&
          !value.toLowerCase().includes("link"));

    if (!nextNeedsMail && !nextNeedsGeminiCredentials) setCustomerMail("");
    if (!nextNeedsGeminiCredentials) {
      setCustomerPw("");
      setShowPassword(false);
    }
  };

  const updateFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (result.status === "error") setResult({ status: "idle" });
  };

  const resetForm = () => {
    setName("");
    setProductText("");
    setPrefillActive(false);
    setCustomerMail("");
    setCustomerPw("");
    setShowPassword(false);
    setPayment("");
    setContact("");
    setNote("");
    setHoneypot("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      <h1 id="order-form-title"><Icon name="file" />Order တင်ရန်</h1>
      <p className="order-form-card-next__intro">
        ငွေလွှဲပြီး screenshot တင်လိုက်ပါ။ Admin က <strong>Viber or Telegram</strong>{" "}
        ကနေ ပြန်ဆက်သွယ်ပါမယ်။<br />Form မတင်ချင်ရင်{" "}
        <a
          href="https://www.messenger.com/t/happyyou2020"
          target="_blank"
          rel="noopener noreferrer"
        >
          Page Messenger
        </a>{" "}
        ကို screenshot တိုက်ရိုက်ပို့လို့လည်း ရပါတယ်။
      </p>

      <form onSubmit={submitOrder}>
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
            value={payment}
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
          <label
            className={file ? "order-file order-file--selected" : "order-file"}
            htmlFor="order-screenshot"
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
          disabled={result.status === "submitting"}
        >
          {result.status === "submitting" ? "ပို့နေသည်…" : "Order တင်မယ်"}
        </button>
      </form>

      {result.status === "success" ? (
        <div className="order-result order-result--success" role="status">
          <strong>✓ Order တင်ပြီးပါပြီ!</strong>
          <p>
            Order ID: <strong>{result.orderId}</strong>
          </p>
          <p>
            Admin က သင်ပေးထားတဲ့ Contact (Viber / Telegram) အတိုင်း မကြာခင်
            ပြန်ဆက်သွယ်ပါမယ်။
          </p>
          <p>Facebook နဲ့လည်း ဆက်သွယ်နိုင်ပါတယ် — Order ID ကို ပို့ထားပါ:</p>
          <a
            className="button button--secondary button--md"
            href={result.fbLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook Page ကို စာပို့မယ်
          </a>
        </div>
      ) : null}

      {result.status === "error" ? (
        <div className="order-result order-result--error" role="alert">
          <ErrorMessage kind={result.kind} />
        </div>
      ) : null}
    </section>
  );
}

export function OrderForm({ initialCatalog }: OrderFormProps) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");

  return (
    <OrderFormState
      key={`${productId ?? ""}:${planId ?? ""}`}
      initialCatalog={initialCatalog}
      productId={productId}
      planId={planId}
    />
  );
}
