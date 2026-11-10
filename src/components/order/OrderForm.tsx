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
   * work \u2014 or a submitted order \u2014 to lose.
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
   * the Ask Price notice \u2014 this card must not repeat it.
   */
  askPriceHandledAbove?: boolean;
  /** `h2` where the page already carries its own `h1` above the card. */
  headingLevel?: "h1" | "h2";
};

const MAIL_REQUIRED_PRODUCTS = new Set(["zoom", "zoom_business", "canva", "duolingo"]);
/**
 * Products whose order cannot be fulfilled without the SIM number the data is
 * loaded onto. Mirrored server-side in `functions/api/order.js` \u2014 a client-side
 * `required` is not a validation. Keep the two lists in step, and note that
 * `resolveProductIdFromText` in `src/services/order.ts` is what makes a
 * hand-typed "Atom 24GB" resolve to an id in this set.
 */
const PHONE_REQUIRED_PRODUCTS = new Set(["atom-data", "mytel-data"]);
const GEMINI_PRODUCT_ID = "gemini";
const GEMINI_LINK_PLAN_ID = "18_months";
const FILE_IDLE_TEXT = "Screenshot \u101b\u103d\u1031\u1038\u101b\u1014\u103a \u1014\u103e\u102d\u1015\u103a\u1015\u102b";
/**
 * The same free-text rule the server applies in `functions/api/order.js`.
 * It MUST be checked here too: the server gates on this text as well as on
 * `product_id`, and `resolveProductIdFromText` returns on the first catalog
 * NAME match before it reaches its atom/mytel fallbacks \u2014 so "Tidal + Mytel
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
      {" "}(&#4126;&#4141;&#4143;&#4151;) Telegram Bot{" "}
      <a href="https://t.me/PSNamso_bot" target="_blank" rel="noopener noreferrer">
        @PSNamso_bot
      </a>{" "}
      (&#4126;&#4141;&#4143;&#4151;){" "}
      <a
        href="https://www.messenger.com/t/happyyou2020"
        target="_blank"
        rel="noopener noreferrer"
      >
        Page Messenger
      </a>{" "}
      &#4096;&#4116;&#4145; &#4102;&#4096;&#4154;&#4126;&#4157;&#4122;&#4154;&#4116;&#4141;&#4143;&#4100;&#4154;&#4117;&#4139;&#4112;&#4122;&#4154;&#4171;
    </>
  );

  if (kind === "missing-file") {
    return (
      <>&#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146; Screenshot &#4123;&#4157;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4134;&#4152; &#8212; &#4129;&#4117;&#4145;&#4139;&#4154;&#4096; &#8220;{FILE_IDLE_TEXT}&#8221; &#4096;&#4141;&#4143;&#4116;&#4158;&#4141;&#4117;&#4154;&#4117;&#4156;&#4142;&#4152; &#4117;&#4143;&#4150;&#4123;&#4157;&#4145;&#4152;&#4117;&#4139;&#4171;</>
    );
  }
  if (kind === "file-too-large") {
    return <>Screenshot &#4118;&#4141;&#4143;&#4100;&#4154;&#4096; 8MB &#4113;&#4096;&#4154;&#4096;&#4156;&#4142;&#4152;&#4116;&#4145;&#4117;&#4139;&#4112;&#4122;&#4154;&#4171; &#4117;&#4141;&#4143;&#4126;&#4145;&#4152;&#4112;&#4146;&#4151;&#4117;&#4143;&#4150; &#4117;&#4156;&#4116;&#4154;&#4123;&#4157;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;</>;
  }
  if (kind === "unsupported-file") {
    return (
      <>
        &#4114;&#4142; screenshot &#4118;&#4141;&#4143;&#4100;&#4154;&#4129;&#4121;&#4155;&#4141;&#4143;&#4152;&#4129;&#4101;&#4140;&#4152;&#4096;&#4141;&#4143; &#4124;&#4096;&#4154;&#4121;&#4097;&#4150;&#4117;&#4139;&#4171; &#4117;&#4143;&#4150;&#4096;&#4141;&#4143; <strong>JPG / PNG</strong>{" "}
        &#4129;&#4116;&#4145;&#4116;&#4146;&#4151; &#4117;&#4156;&#4116;&#4154;&#4126;&#4141;&#4121;&#4154;&#4152;&#4117;&#4156;&#4142;&#4152; (iPhone &#4102;&#4141;&#4143;&#4123;&#4100;&#4154; screenshot &#4096;&#4141;&#4143; Photos &#4113;&#4146;&#4096;&#4116;&#4145; share &#8594; save
        &#4129;&#4126;&#4101;&#4154;&#4124;&#4143;&#4117;&#4154;&#4117;&#4156;&#4142;&#4152;) &#4113;&#4117;&#4154;&#4112;&#4100;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;
      </>
    );
  }
  if (kind === "missing-fields") {
    return <>&#4124;&#4141;&#4143;&#4129;&#4117;&#4154;&#4112;&#4146;&#4151; &#4129;&#4097;&#4155;&#4096;&#4154;&#4129;&#4124;&#4096;&#4154; &#4121;&#4117;&#4156;&#4106;&#4151;&#4154;&#4101;&#4143;&#4150;&#4126;&#4145;&#4152;&#4117;&#4139; &#8212; * &#4117;&#4139;&#4112;&#4146;&#4151; &#4129;&#4096;&#4157;&#4096;&#4154;&#4129;&#4140;&#4152;&#4124;&#4143;&#4150;&#4152; &#4118;&#4156;&#4106;&#4151;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;</>;
  }
  if (kind === "bad-phone") {
    return (
      <>
        Data &#4113;&#4106;&#4151;&#4154;&#4121;&#4106;&#4151;&#4154; &#4118;&#4143;&#4116;&#4154;&#4152;&#4116;&#4150;&#4117;&#4139;&#4112;&#4154;&#4096;&#4141;&#4143; <strong>09xxxxxxxxx</strong> &#4117;&#4143;&#4150;&#4101;&#4150;&#4118;&#4156;&#4100;&#4151;&#4154;
        &#4117;&#4156;&#4116;&#4154;&#4123;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;{fallback}
      </>
    );
  }
  if (kind === "delivery") {
    return <>Order &#4096; Admin &#4102;&#4142; &#4121;&#4123;&#4145;&#4140;&#4096;&#4154;&#4126;&#4145;&#4152;&#4117;&#4139;&#4171; &#4097;&#4111;&#4116;&#4145; &#4113;&#4117;&#4154;&#4096;&#4156;&#4141;&#4143;&#4152;&#4101;&#4140;&#4152;&#4117;&#4139;{fallback}</>;
  }
  if (kind === "timeout") {
    return (
      <>
        Order &#4117;&#4141;&#4143;&#4151;&#4112;&#4140; &#4129;&#4097;&#4155;&#4141;&#4116;&#4154;&#4096;&#4156;&#4140;&#4116;&#4145;&#4124;&#4141;&#4143;&#4151; &#4123;&#4117;&#4154;&#4124;&#4141;&#4143;&#4096;&#4154;&#4117;&#4139;&#4112;&#4122;&#4154;&#4171;{" "}
        <strong>Order &#4096; &#4123;&#4145;&#4140;&#4096;&#4154;&#4116;&#4158;&#4100;&#4151;&#4154;&#4117;&#4156;&#4142;&#4152; &#4118;&#4156;&#4101;&#4154;&#4116;&#4145;&#4116;&#4141;&#4143;&#4100;&#4154;&#4117;&#4139;&#4112;&#4122;&#4154;</strong> &#8212; &#4113;&#4117;&#4154;&#4121;&#4112;&#4100;&#4154;&#4097;&#4100;&#4154; &#4129;&#4145;&#4140;&#4096;&#4154;&#4096;
        &#4124;&#4121;&#4154;&#4152;&#4096;&#4156;&#4145;&#4140;&#4100;&#4154;&#4152;&#4112;&#4101;&#4154;&#4097;&#4143;&#4096;&#4116;&#4145; Admin &#4096;&#4141;&#4143; &#4129;&#4123;&#4100;&#4154; &#4101;&#4101;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;{fallback}
      </>
    );
  }
  return <>Order &#4117;&#4141;&#4143;&#4151;&#4121;&#4123;&#4126;&#4145;&#4152;&#4117;&#4139;&#4171; Internet &#4117;&#4156;&#4116;&#4154;&#4101;&#4101;&#4154;&#4117;&#4156;&#4142;&#4152; &#4113;&#4117;&#4154;&#4096;&#4156;&#4141;&#4143;&#4152;&#4101;&#4140;&#4152;&#4117;&#4139;{fallback}</>;
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
  // outline \u2014 on /order/ it is the page's only heading.
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
          &#10003; Order &#4112;&#4100;&#4154;&#4117;&#4156;&#4142;&#4152;&#4117;&#4139;&#4117;&#4156;&#4142;!
        </Heading>
        <p>
          Order ID: <strong>{result.orderId}</strong>
        </p>
        <p>
          Admin &#4096; &#4126;&#4100;&#4151;&#4154; Viber (&#4126;&#4141;&#4143;&#4151;) Telegram &#4096;&#4116;&#4145; &#4121;&#4096;&#4156;&#4140;&#4097;&#4100;&#4154; &#4102;&#4096;&#4154;&#4126;&#4157;&#4122;&#4154;&#4117;&#4156;&#4142;&#4152; Account
          &#4117;&#4141;&#4143;&#4151;&#4117;&#4145;&#4152;&#4117;&#4139;&#4121;&#4122;&#4154;&#4171;
        </p>
        <p>&#4121;&#4145;&#4152;&#4101;&#4123;&#4140;&#4123;&#4158;&#4141;&#4123;&#4100;&#4154; Order ID &#4116;&#4146;&#4151; &#4102;&#4096;&#4154;&#4126;&#4157;&#4122;&#4154;&#4117;&#4139;&#4171;</p>
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

  // Outcome haptic, plus bringing the outcome into view \u2014 on a phone both the
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
        <Heading id="order-form-title"><Icon name="file" />Order &#4121;&#4112;&#4100;&#4154;&#4097;&#4100;&#4154; &#4121;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;</Heading>
        <p>&#4114;&#4142; plan &#4129;&#4112;&#4157;&#4096;&#4154; &#4100;&#4157;&#4145;&#4121;&#4124;&#4157;&#4158;&#4146;&#4097;&#4100;&#4154; &#4124;&#4096;&#4154;&#4123;&#4158;&#4141;&#4101;&#4155;&#4145;&#4152;&#4116;&#4158;&#4143;&#4116;&#4154;&#4152;&#4116;&#4146;&#4151; order availability &#4096;&#4141;&#4143; Admin &#4096;&#4141;&#4143; &#4129;&#4123;&#4100;&#4154;&#4121;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;</p>
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
      <Heading id="order-form-title"><Icon name="file" />Order &#4112;&#4100;&#4154;&#4123;&#4116;&#4154;</Heading>
      {/* A customer reading this has already transferred money. Anything that
          reads as "or do something else instead" belongs before that point,
          not here \u2014 say what to do and what happens next. */}
      <p className="order-form-card-next__intro">
        &#4129;&#4097;&#4155;&#4096;&#4154;&#4129;&#4124;&#4096;&#4154;&#4118;&#4156;&#4106;&#4151;&#4154;&#4117;&#4156;&#4142;&#4152; &#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146; screenshot &#4112;&#4100;&#4154;&#4117;&#4139;&#4171; Admin &#4096; &#4126;&#4100;&#4151;&#4154;{" "}
        <strong>Viber (&#4126;&#4141;&#4143;&#4151;) Telegram</strong> &#4096;&#4116;&#4145; Account &#4117;&#4141;&#4143;&#4151;&#4117;&#4145;&#4152;&#4117;&#4139;&#4121;&#4122;&#4154;&#4171;
      </p>

      <form onSubmit={submitOrder} onInput={clearOutcome}>
        <input
          type="hidden"
          name="product_id"
          value={activePrefill?.product.id ?? ""}
        />
        <input type="hidden" name="plan_id" value={prefilledPlanId} />

        <div className="order-field">
          <label htmlFor="order-name">&#4116;&#4140;&#4121;&#4106;&#4154; *</label>
          <input
            id="order-name"
            name="name"
            type="text"
            required
            maxLength={60}
            placeholder="&#4126;&#4100;&#4151;&#4154;&#4116;&#4140;&#4121;&#4106;&#4154;"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="order-field">
          <label htmlFor="order-product">&#4125;&#4122;&#4154;&#4122;&#4144;&#4124;&#4141;&#4143;&#4126;&#4106;&#4151;&#4154; &#4117;&#4101;&#4153;&#4101;&#4106;&#4154;&#4152; *</label>
          <input
            id="order-product"
            name="product"
            type="text"
            required
            maxLength={120}
            placeholder="&#4133;&#4117;&#4121;&#4140; - Netflix 1 Month"
            value={productText}
            onChange={(event) => updateProduct(event.target.value)}
            aria-describedby={showOutOfStock ? "order-stock-warning" : undefined}
          />
          {showOutOfStock ? (
            <p id="order-stock-warning" className="order-stock-warning" role="alert">
              &#4126;&#4112;&#4141;&#4117;&#4156;&#4143;&#4123;&#4116;&#4154; &#8212; &#4114;&#4142; plan &#4096; &#4124;&#4145;&#4140;&#4124;&#4145;&#4140;&#4102;&#4122;&#4154; stock &#4121;&#4123;&#4158;&#4141;&#4117;&#4139;&#4171; Order &#4112;&#4100;&#4154;&#4113;&#4140;&#4152;&#4123;&#4100;&#4154; stock
              &#4117;&#4156;&#4116;&#4154;&#4123;&#4158;&#4141;&#4097;&#4155;&#4141;&#4116;&#4154; Admin &#4096; &#4129;&#4096;&#4156;&#4145;&#4140;&#4100;&#4154;&#4152;&#4117;&#4156;&#4116;&#4154;&#4117;&#4139;&#4121;&#4122;&#4154;&#4171;
            </p>
          ) : null}
        </div>

        {/* Kept mounted and only `hidden`, like the mail field: the value stays
            in the FormData contract, and `required`/`pattern` are bound to the
            requirement rather than the visibility. A `required` or `pattern` on
            a hidden input Chrome cannot focus dead-ends the whole submit with
            "an invalid form control is not focusable". */}
        <div className="order-field" hidden={!phoneRequired}>
          <label htmlFor="order-phone">Data &#4113;&#4106;&#4151;&#4154;&#4121;&#4106;&#4151;&#4154; &#4118;&#4143;&#4116;&#4154;&#4152;&#4116;&#4150;&#4117;&#4139;&#4112;&#4154; *</label>
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
            title="Data &#4113;&#4106;&#4151;&#4154;&#4117;&#4145;&#4152;&#4123;&#4121;&#4106;&#4151;&#4154; &#4116;&#4150;&#4117;&#4139;&#4112;&#4154;&#4096;&#4141;&#4143; 09xxxxxxxxx &#4117;&#4143;&#4150;&#4101;&#4150;&#4118;&#4156;&#4100;&#4151;&#4154; &#4123;&#4145;&#4152;&#4117;&#4139;"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <p className="order-field__hint">
            Data &#4113;&#4106;&#4151;&#4154;&#4117;&#4145;&#4152;&#4121;&#4106;&#4151;&#4154; &#4116;&#4150;&#4117;&#4139;&#4112;&#4154;&#4096;&#4141;&#4143; &#4129;&#4112;&#4141;&#4129;&#4096;&#4155; &#4123;&#4145;&#4152;&#4117;&#4139;&#4171; &#4129;&#4145;&#4140;&#4096;&#4154;&#4096; Contact &#4116;&#4146;&#4151;
            &#4121;&#4112;&#4144;&#4106;&#4142;&#4124;&#4106;&#4154;&#4152; &#4123;&#4117;&#4139;&#4112;&#4122;&#4154; &#8212; Contact &#4096; &#4117;&#4156;&#4116;&#4154;&#4102;&#4096;&#4154;&#4126;&#4157;&#4122;&#4154;&#4123;&#4116;&#4154;&#4170; &#4114;&#4139;&#4096; data &#4125;&#4100;&#4154;&#4121;&#4106;&#4151;&#4154; SIM &#4117;&#4139;&#4171;
          </p>
        </div>

        <div className="order-field" hidden={!showMailField}>
          <label htmlFor="order-mail">
            {mailRequired ? "Upgrade \u101c\u102f\u1015\u103a\u1019\u100a\u1037\u103a \u101e\u1004\u1037\u103a Email *" : "Gmail (optional)"}
          </label>
          <input
            id="order-mail"
            name="customer_mail"
            /* While this field is hidden, a leftover value still fails email
               validation, and Chrome then refuses to submit with "an invalid
               form control is not focusable" \u2014 a dead end the customer cannot
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
              ? "\u1012\u102e product \u1000 \u101e\u1004\u1037\u103a mail \u1015\u1031\u102b\u103a\u1019\u103e\u102c \u1010\u1004\u103a\u1015\u1031\u1038\u101b\u1010\u102c\u1019\u102d\u102f\u1037 Email \u1016\u103c\u100a\u1037\u103a\u1015\u1031\u1038\u1015\u102b\u104b"
              : "Gemini \u1000 \u101e\u1004\u1037\u103a Gmail + Password \u1014\u1032\u1037 \u1010\u1004\u103a\u1015\u1031\u1038\u101b\u1015\u102b\u1010\u101a\u103a\u104b \u1021\u1001\u102f\u1019\u1016\u103c\u100a\u1037\u103a\u1001\u103b\u1004\u103a\u101b\u1004\u103a Admin \u1006\u1000\u103a\u101e\u103d\u101a\u103a\u101c\u102c\u1001\u103b\u102d\u1014\u103a \u1015\u1031\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b"}
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
            Password &#4117;&#4156;&#4123;&#4116;&#4154;
          </label>
        </div>

        <div className="order-field">
          <label htmlFor="order-payment">&#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146;&#4113;&#4140;&#4152;&#4126;&#4106;&#4151;&#4154; &#4116;&#4106;&#4154;&#4152;&#4124;&#4121;&#4154;&#4152; *</label>
          <select
            id="order-payment"
            name="payment"
            required
            /* The scanned platform wins until the customer chooses for
               themselves; after that their own choice sticks. */
            value={payment || defaultPayment}
            onChange={(event) => setPayment(event.target.value)}
          >
            <option value="">&#4123;&#4157;&#4145;&#4152;&#4117;&#4139;</option>
            <option>KBZ Pay</option>
            <option>Wave Pay</option>
            <option>AYA Pay</option>
            <option>Other</option>
          </select>
        </div>

        <div className="order-field">
          <label htmlFor="order-contact">
            &#4117;&#4156;&#4116;&#4154;&#4102;&#4096;&#4154;&#4126;&#4157;&#4122;&#4154;&#4123;&#4116;&#4154; Viber &#4116;&#4150;&#4117;&#4139;&#4112;&#4154; &#4126;&#4141;&#4143;&#4151;&#4121;&#4127;&#4143;&#4112;&#4154; Telegram Username *
          </label>
          <input
            id="order-contact"
            name="contact"
            type="text"
            required
            maxLength={40}
            placeholder="09xxxxxxxxx (&#4126;&#4141;&#4143;&#4151;) @username"
            autoComplete="off"
            pattern={CONTACT_PATTERN}
            title="Viber &#4116;&#4150;&#4117;&#4139;&#4112;&#4154; (09xxxxxxxxx) &#4126;&#4141;&#4143;&#4151;&#4121;&#4127;&#4143;&#4112;&#4154; Telegram username (@username) &#4118;&#4156;&#4106;&#4151;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
          />
        </div>

        <div className="order-field">
          <span className="order-field__label">&#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146; Screenshot *</span>
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
            <span aria-hidden="true">&#9635;</span>
            <span>{file?.name || FILE_IDLE_TEXT}</span>
          </label>
          <p className="order-field__hint order-field__hint--file">JPG, PNG, WebP &#4116;&#4158;&#4100;&#4151;&#4154; mobile image &#4121;&#4155;&#4140;&#4152; &#8212; &#4129;&#4121;&#4155;&#4140;&#4152;&#4102;&#4143;&#4150;&#4152; 8MB</p>
        </div>

        <div className="order-field">
          <label htmlFor="order-note">&#4121;&#4158;&#4112;&#4154;&#4097;&#4155;&#4096;&#4154; (optional)</label>
          <textarea
            id="order-note"
            name="note"
            rows={2}
            maxLength={300}
            placeholder="&#4113;&#4117;&#4154;&#4118;&#4156;&#4106;&#4151;&#4154;&#4117;&#4156;&#4145;&#4140;&#4097;&#4155;&#4100;&#4154;&#4112;&#4140;&#4123;&#4158;&#4141;&#4123;&#4100;&#4154; &#4123;&#4145;&#4152;&#4117;&#4139;"
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
          {result.status === "submitting" ? "\u1015\u102d\u102f\u1037\u1014\u1031\u101e\u100a\u103a\u2026" : "Order \u1010\u1004\u103a\u1019\u101a\u103a"}
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
