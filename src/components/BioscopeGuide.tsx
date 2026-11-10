"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dataSource from "@/data/bioscope-download.json";
import savedLinks from "@/data/bioscope-resolved-links.json";
import { parseResolvedLinks, resolveDownloads, type BioscopeData, type ResolvedBioscopeLinks } from "@/lib/bioscope";

const data: BioscopeData = dataSource;
const kindLabels: Record<string, string> = { apk: "APK", dmg: "DMG", exe: "EXE", store: "Play Store", testflight: "TestFlight", zip: "ZIP" };

const subscribeToDevice = () => () => {};
const getServerDevice = (): string | null => null;
function getDetectedDevice(): string | null {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) ? (/TV|AFT|BRAVIA|SHIELD/i.test(ua) ? "androidtv" : "android")
    : /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios"
    : /Mac/i.test(ua) ? "mac" : /Windows/i.test(ua) ? "windows" : null;
}

export default function BioscopeGuide() {
  const [requestedGroup, setRequestedGroup] = useState<string | null>(null);
  const detectedDevice = useSyncExternalStore(subscribeToDevice, getDetectedDevice, getServerDevice);
  const [links, setLinks] = useState<ResolvedBioscopeLinks>(savedLinks.resolved);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/bioscope-links", { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Download updates unavailable"); return response.json(); })
      .then((value: unknown) => { const resolved = parseResolvedLinks(value); if (Object.keys(resolved).length) setLinks(resolved); })
      .catch(() => { /* Keep the verified published links when updates are unavailable. */ });
    return () => controller.abort();
  }, []);

  const detectedGroup = data.groups.find((group) => detectedDevice && group.detect.includes(detectedDevice));
  const activeGroupId = requestedGroup || detectedGroup?.id || data.groups[0].id;
  const downloads = resolveDownloads(data.downloads, links).filter((download) => download.group === activeGroupId);
  if (detectedDevice) downloads.sort((a, b) => Number(b.detect === detectedDevice) - Number(a.detect === detectedDevice));
  const primary = downloads.find((download) => download.detect === detectedDevice) || downloads.find((download) => download.featured) || downloads[0];
  const guide = data.guides.find((entry) => entry.group === activeGroupId);

  return (
    <>
      <header className="bioscope-guide-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/${data.app.logo}`} width={96} height={96} alt="" />
        <p className="info-eyebrow">New on Premium Store</p>
        <h1>{data.app.name}</h1>
        <p className="bioscope-app-subtitle">{data.app.subtitle}</p>
        <p className="info-lead">{data.app.tagline}</p>
        <p className="bioscope-updated">Latest Update: {data.updated}</p>
      </header>
      <section aria-labelledby="bioscope-picker-title">
        <p className="info-eyebrow">Choose your screen</p>
        <h2 id="bioscope-picker-title">{"\u1018\u101a\u103a device \u1019\u103e\u102c \u1000\u103c\u100a\u1037\u103a\u1019\u101c\u1032"}</h2>
        <p className="bioscope-picker-intro">{"Bioscope \u1000 screen \u1010\u1005\u103a\u1019\u103b\u102d\u102f\u1038\u1005\u102e\u1021\u1010\u103d\u1000\u103a file \u1010\u1005\u103a\u1019\u103b\u102d\u102f\u1038\u1005\u102e \u1011\u102f\u1010\u103a\u1015\u102b\u1010\u101a\u103a\u104b \u101e\u1004\u1037\u103a device \u1000\u102d\u102f \u101b\u103d\u1031\u1038\u101c\u102d\u102f\u1000\u103a\u101b\u1004\u103a \u101e\u1000\u103a\u1006\u102d\u102f\u1004\u103a\u101b\u102c download \u1014\u1032\u1037 install \u1021\u1006\u1004\u1037\u103a\u1019\u103b\u102c\u1038\u1015\u1032 \u1015\u1031\u102b\u103a\u1015\u102b\u1019\u101a\u103a\u104b \u101e\u1004\u1037\u103a device \u1000\u102d\u102f \u1021\u101c\u102d\u102f\u1021\u101c\u103b\u1031\u102c\u1000\u103a \u101b\u103d\u1031\u1038\u1011\u102c\u1038\u1015\u1031\u1038\u1015\u102b\u1010\u101a\u103a\u104b"}</p>
        <div className="bioscope-device-picker" role="group" aria-label="Device group">
          {data.groups.map((group) => (
            <button key={group.id} type="button" aria-pressed={group.id === activeGroupId} aria-controls="bioscope-downloads" onClick={() => setRequestedGroup(group.id)}>
              <strong>{group.label}</strong><span>{group.hint}</span>
              {detectedGroup?.id === group.id && <small>{"\u101e\u1004\u1037\u103a device"}</small>}
            </button>
          ))}
        </div>
        <div id="bioscope-downloads" key={activeGroupId}>
          <div className="info-card-grid">
            {downloads.map((download) => (
              <article className="info-card bioscope-download-card" data-featured={download.id === primary?.id || undefined} key={download.id}>
                {download.id === primary?.id && <span className="bioscope-recommended">{download.detect === detectedDevice ? "\u101e\u1004\u1037\u103a device \u1021\u1010\u103d\u1000\u103a" : "\u1021\u1000\u103c\u1036\u1015\u103c\u102f\u1001\u103b\u1000\u103a"}</span>}
                <div className="bioscope-card-title"><h3>{download.title}</h3><span>{kindLabels[download.kind]}</span></div>
                {download.note && <p>{download.note}</p>}
                {(download.version || download.size) && <dl className="bioscope-download-meta">
                  {download.version && <div><dt>Version</dt><dd>{download.version}</dd></div>}
                  {download.size && <div><dt>Size</dt><dd>{download.size}</dd></div>}
                </dl>}
                <a className="info-action" href={download.href} target={["store", "testflight"].includes(download.kind) ? "_blank" : undefined} rel="noopener noreferrer">{download.action}</a>
                {download.alternates?.map((link) => <a className="bioscope-alternate" key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
              </article>
            ))}
          </div>
          {guide && <div className="bioscope-install-guide">
            <h3>{"Install \u101c\u102f\u1015\u103a\u1014\u100a\u103a\u1038"}</h3>
            {guide.sections.map((section) => (
              <section className="bioscope-install-section" key={section.title}>
                <h4>{section.title}</h4>
                <ol className="bioscope-install-steps">
                  {section.steps.map((step, index) => (
                    <li key={index} data-kind={step.kind || "step"}>
                      <div className="bioscope-step-content">
                        <p>{step.text}</p>
                        {step.images && <div className="bioscope-guide-photos" data-count={step.images.length}>
                          {step.images.map((photo) => (
                            <figure key={photo.src} data-portrait={photo.height / photo.width >= 1.7 || undefined}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/${photo.src}`} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
                              {photo.caption && <figcaption>{photo.caption}</figcaption>}
                            </figure>
                          ))}
                        </div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>}
        </div>
      </section>
    </>
  );
}
