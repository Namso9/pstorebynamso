"use client";

import Image from "next/image";
import { type ReactNode, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { HapticSwitch } from "@/components/common/HapticSwitch";
import { Icon, type IconName } from "@/components/common/Icon";
import { ErrorState } from "@/components/common/StatusState";
import { useDetectedDevice } from "@/hooks/useDetectedDevice";
import { useLiveContent } from "@/hooks/useLiveContent";
import { useResolvedBioscopeLinks } from "@/hooks/useResolvedBioscopeLinks";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { applyResolvedLinks } from "@/services/bioscope-links";
import { publicAssetPath } from "@/services/catalog";
import { fetchBioscopeDownloadData } from "@/services/content";
import type {
  BioscopeDeviceToken,
  BioscopeDownload,
  BioscopeDownloadData,
  BioscopeDownloadKind,
  BioscopeGroup,
  BioscopeGuideSection,
  BioscopeGuideStep,
} from "@/types/content";

/** What the visitor ends up holding, shown next to the version. */
const kindLabels: Record<BioscopeDownloadKind, string> = {
  apk: "APK",
  dmg: "DMG",
  exe: "EXE",
  store: "Play Store",
  testflight: "TestFlight",
  zip: "ZIP",
};

/** Store and beta pages open in a new tab; a file link just downloads. */
const pageKinds = new Set<BioscopeDownloadKind>(["store", "testflight"]);

/** The rail's icon follows what a group actually covers, not its position. */
const deviceIcons: Record<BioscopeDeviceToken, IconName> = {
  android: "phone",
  androidtv: "tv",
  ios: "phone",
  mac: "desktop",
  windows: "desktop",
};

/**
 * A phone screenshot, not merely a tall one: 19.5:9 and taller. A desktop
 * dialog capture can also be taller than wide (the macOS password prompt is
 * 1200x1500) and must keep the full measure to stay readable.
 */
function isPhoneCapture(image: { width: number; height: number }) {
  return image.height / image.width >= 1.7;
}

function groupIcon(group: BioscopeGroup): IconName {
  for (const token of group.detect) {
    const icon = deviceIcons[token];
    if (icon) return icon;
  }
  return "phone";
}

export function BioscopeDownloads({
  initialData,
}: {
  initialData: BioscopeDownloadData;
}) {
  const { value, status, error, refresh } = useLiveContent(
    initialData,
    fetchBioscopeDownloadData,
  );
  const { app, groups, guides } = value;
  // Bioscope renames the installer on every release, so the pinned links are a
  // floor, not the truth. The resolver overlays whatever they publish now.
  const resolvedLinks = useResolvedBioscopeLinks();
  const downloads = useMemo(
    () => applyResolvedLinks(value.downloads, resolvedLinks),
    [resolvedLinks, value.downloads],
  );

  // The server renders the first group. Detection resolves right after
  // hydration, so a TV-box or Windows visitor lands on their own row without
  // the markup and the HTML ever disagreeing.
  const detectedToken = useDetectedDevice();
  const [requestedGroupId, setRequestedGroupId] = useState<string | null>(null);
  const [hasSwitched, setHasSwitched] = useState(false);
  const reducedMotion = useReducedMotion();

  const detectedGroupId = useMemo(() => {
    if (!detectedToken) return null;
    return (
      groups.find((group) => group.detect.includes(detectedToken))?.id || null
    );
  }, [detectedToken, groups]);

  const fallbackGroupId = groups[0]?.id || "";
  const preferredGroupId = requestedGroupId || detectedGroupId || fallbackGroupId;
  // A live edit can retire a group while it is the selected one.
  const activeGroupId = groups.some((group) => group.id === preferredGroupId)
    ? preferredGroupId
    : fallbackGroupId;

  // The visitor's own device leads the group it belongs to; without detection
  // the data's `featured` entry does. Sorting is stable, so everything else
  // keeps its authored order.
  const activeDownloads = useMemo(() => {
    const inGroup = downloads.filter(
      (download) => download.group === activeGroupId,
    );
    if (!detectedToken) return inGroup;
    const isDetected = (download: BioscopeDownload) =>
      download.detect === detectedToken ? 0 : 1;
    return [...inGroup].sort((a, b) => isDetected(a) - isDetected(b));
  }, [activeGroupId, detectedToken, downloads]);

  const activeGuide = guides.find((guide) => guide.group === activeGroupId);
  const primaryDownload =
    (detectedToken &&
      activeDownloads.find((download) => download.detect === detectedToken)) ||
    activeDownloads.find((download) => download.featured) ||
    activeDownloads[0];

  const heroMotion = useRevealMotion({ duration: 0.46, offset: 18, amount: 0.1 });
  const cardMotion = (index: number) =>
    reducedMotion || !hasSwitched
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.34,
            delay: Math.min(index, 5) * 0.05,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <>
      <motion.header className="bioscope-hero" {...heroMotion}>
        <span className="bioscope-hero__mark">
          <Image
            className={["bioscope-hero__logo", app.logoClass]
              .filter(Boolean)
              .join(" ")}
            src={publicAssetPath(app.logo)}
            alt=""
            width={96}
            height={96}
            priority
          />
        </span>
        <p className="eyebrow">New on Premium Store</p>
        <h1>{app.name}</h1>
        <p className="bioscope-hero__subtitle">{app.subtitle}</p>
        <p className="bioscope-hero__tagline">{app.tagline}</p>
        <p className="bioscope-updated">Latest Update: {value.updated}</p>
      </motion.header>

      {status === "error" ? (
        <div className="content-inline-error">
          <ErrorState
            title="Live download update မရသေးပါ"
            message={`${error || "Network error"} နောက်ဆုံး build data ကို ပြထားပါတယ်။`}
            onRetry={refresh}
          />
        </div>
      ) : null}

      <section className="bioscope-picker" aria-labelledby="bioscope-picker-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose your screen</p>
            <h2 id="bioscope-picker-title">ဘယ် device မှာ ကြည့်မလဲ</h2>
            <p>
              Bioscope က screen တစ်မျိုးစီအတွက် file တစ်မျိုးစီ ထုတ်ပါတယ်။
              သင့် device ကို ရွေးလိုက်ရင် သက်ဆိုင်ရာ download နဲ့ install
              အဆင့်များပဲ ပေါ်ပါမယ်။ သင့် device ကို အလိုအလျောက်
              ရွေးထားပေးပါတယ်။
            </p>
          </div>
        </div>

        {/* Toggle buttons rather than an ARIA tablist: a real tablist owes the
            keyboard arrow-key navigation this control does not implement. */}
        <div className="bioscope-rail" role="group" aria-label="Device group">
          {groups.map((group) => {
            const active = group.id === activeGroupId;
            return (
              <button
                className="bioscope-rail__tab"
                type="button"
                aria-pressed={active}
                aria-controls="bioscope-downloads"
                data-active={active || undefined}
                data-haptic="selection"
                key={group.id}
                onClick={() => {
                  setHasSwitched(true);
                  setRequestedGroupId(group.id);
                }}
              >
                <Icon name={groupIcon(group)} />
                <span className="bioscope-rail__label">{group.label}</span>
                <span className="bioscope-rail__hint">{group.hint}</span>
                {group.id === detectedGroupId ? (
                  <span className="bioscope-rail__flag">သင့် device</span>
                ) : null}
                <HapticSwitch />
              </button>
            );
          })}
        </div>

        <div
          className="bioscope-panel"
          id="bioscope-downloads"
          aria-label="Downloads and install steps"
          key={activeGroupId}
        >
          {activeDownloads.length ? (
            <div className="bioscope-grid">
              {activeDownloads.map((download, index) => (
                <motion.div
                  className="bioscope-card"
                  data-featured={
                    download.id === primaryDownload?.id || undefined
                  }
                  key={download.id}
                  {...cardMotion(index)}
                >
                  {download.id === primaryDownload?.id ? (
                    <span className="bioscope-card__flag">
                      {detectedToken && download.detect === detectedToken
                        ? "သင့် device အတွက်"
                        : "အကြံပြုချက်"}
                    </span>
                  ) : null}
                  <div className="bioscope-card__head">
                    <h3>{download.title}</h3>
                    <span className="bioscope-card__kind">
                      {kindLabels[download.kind]}
                    </span>
                  </div>
                  {download.note ? (
                    <p className="bioscope-card__note">{download.note}</p>
                  ) : null}
                  {download.version || download.size ? (
                    <dl className="bioscope-card__meta">
                      {download.version ? (
                        <div>
                          <dt>Version</dt>
                          <dd>{download.version}</dd>
                        </div>
                      ) : null}
                      {download.size ? (
                        <div>
                          <dt>Size</dt>
                          <dd>{download.size}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                  <div
                    className="bioscope-card__actions"
                    data-count={1 + (download.alternates?.length || 0)}
                  >
                    <DownloadLink
                      className="button button--primary button--md bioscope-card__action"
                      href={download.href}
                      external={pageKinds.has(download.kind)}
                    >
                      <Icon
                        name={
                          pageKinds.has(download.kind) ? "external" : "download"
                        }
                      />
                      <span>{download.action}</span>
                    </DownloadLink>
                    {download.alternates?.map((alternate) => (
                      <DownloadLink
                        className="button button--secondary button--md bioscope-card__action"
                        href={alternate.href}
                        external={pageKinds.has(download.kind)}
                        key={alternate.href}
                      >
                        <Icon name="download" />
                        <span>{alternate.label}</span>
                      </DownloadLink>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="bioscope-empty">
              ဒီ device အတွက် download လောလောဆယ် မရှိသေးပါ။ Official channel
              များမှ မေးမြန်းနိုင်ပါတယ်။
            </p>
          )}

          {activeGuide ? (
            <div className="bioscope-guide">
              <h3 className="bioscope-guide__title">Install လုပ်နည်း</h3>
              {activeGuide.sections.map((section) => (
                <GuideSection section={section} key={section.title} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function GuideSection({ section }: { section: BioscopeGuideSection }) {
  return (
    <section className="bioscope-guide__block">
      <h4>{section.title}</h4>
      <ol className="bioscope-steps">
        {section.steps.map((step, index) => (
          <GuideStep step={step} key={`${section.title}-${index}`} />
        ))}
      </ol>
    </section>
  );
}

function GuideStep({ step }: { step: BioscopeGuideStep }) {
  const kind = step.kind || "step";
  return (
    <li className="bioscope-step" data-kind={kind}>
      {kind === "step" ? (
        <span className="bioscope-steps__marker" aria-hidden="true" />
      ) : null}
      <div className="bioscope-step__body">
        <p>{step.text}</p>
        {step.images?.length ? (
          <div className="bioscope-shots" data-count={step.images.length}>
            {step.images.map((image) => (
              <figure
                className="bioscope-shot"
                data-portrait={isPhoneCapture(image) || undefined}
                key={image.src}
              >
                <Image
                  src={publicAssetPath(image.src)}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                />
                {image.caption ? (
                  <figcaption>{image.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * `HapticSwitch` is deliberately absent: it overlays its host, and over an
 * `<a>` it swallows the navigation. Links stay on the delegated
 * `data-haptic` path, exactly like the checkout options.
 */
function DownloadLink({
  className,
  href,
  external,
  children,
}: {
  className: string;
  href: string;
  external: boolean;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      data-haptic="medium"
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : { rel: "noopener noreferrer nofollow" })}
    >
      {children}
    </a>
  );
}
