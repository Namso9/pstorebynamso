"use client";

import { ErrorState } from "@/components/common/StatusState";
import { useLiveContent } from "@/hooks/useLiveContent";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { fetchExpressGuideData } from "@/services/content";
import type { ExpressGuideData, ExpressLocation } from "@/types/content";
import { motion } from "motion/react";

const protocolDescriptions: Record<string, string> = {
  Automatic:
    "ExpressVPN will automatically pick the protocol most appropriate for your network.",
  "Lightway - UDP":
    "Engineered by ExpressVPN, Lightway is optimized for speed, security, and reliability—and provides post-quantum support.",
  "Lightway - TCP":
    "May be slower than Lightway - UDP but connects better on certain networks. Also offers post-quantum protection.",
  WireGuard: "Should be effective across most network types, but no TCP client.",
  IKEv2: "Fast, but may not work on all networks.",
};

const encryptionOptions = ["Automatic", "AES", "ChaCha20"];

export function ExpressGuide({ initialData }: { initialData: ExpressGuideData }) {
  const { value, status, error, refresh } = useLiveContent(
    initialData,
    fetchExpressGuideData,
  );
  const locations = value.locations.filter((location) => location.protocol);

  return (
    <>
      <div className="guide-updated">Latest Update: {value.updated}</div>
      {status === "error" ? (
        <div className="content-inline-error">
          <ErrorState
            title="Live guide update မရသေးပါ"
            message={`${error || "Network error"} နောက်ဆုံး build data ကို ပြထားပါတယ်။`}
            onRetry={refresh}
          />
        </div>
      ) : null}
      <div className="express-location-list">
        {locations.map((location, index) => (
          <LocationGuide
            location={location}
            index={index}
            key={`${location.country}-${location.city}-${index}`}
          />
        ))}
      </div>
    </>
  );
}

function LocationGuide({
  location,
  index,
}: {
  location: ExpressLocation;
  index: number;
}) {
  const lightway = location.protocol.startsWith("Lightway");
  const protocolClass = location.protocol === "Lightway - UDP"
    ? "location-step--lightway-udp"
    : location.protocol === "Lightway - TCP"
      ? "location-step--lightway-tcp"
      : location.protocol === "Automatic"
        ? "location-step--automatic"
        : location.protocol === "Automatic or Wireguard"
          ? "location-step--automatic-wireguard"
          : "";
  const selectedEncryption = location.encryption || "Automatic";
  const revealMotion = useRevealMotion({
    delay: (index % 3) * 0.04,
    duration: 0.42,
    amount: 0.12,
  });

  return (
    <motion.article
      className="location-guide"
      {...revealMotion}
    >
      <section className={`location-step ${protocolClass}`}>
        <span className="location-step__badge location-step__badge--green">
          STEP 1: Protocol ချိန်းပါ
        </span>
        <div className="protocol-panel">
          <p className="location-step__label">Select Protocol:</p>
          <div className="protocol-choice">
            <span className="choice-radio choice-radio--selected" aria-hidden="true" />
            <div>
              <strong>{location.protocol}</strong>
              <p>{protocolDescriptions[location.protocol] || ""}</p>
            </div>
          </div>
          {lightway ? (
            <div className="encryption-box">
              <p>Select Lightway encryption:</p>
              {encryptionOptions.map((option) => {
                const selected = option === selectedEncryption;
                return (
                  <div className="encryption-row" key={option}>
                    <span className={selected ? "choice-radio choice-radio--selected" : "choice-radio"} aria-hidden="true" />
                    <span className={selected ? "encryption-row__selected" : ""}>
                      {option === "Automatic" ? "Automatic (recommended)" : option}
                    </span>
                  </div>
                );
              })}
              <div className="heartbeat-row">
                <div>
                  <strong>Lightway NAT heartbeats</strong>
                  <p>
                    Enabling this setting will help some apps and email clients
                    fetch notifications faster. This will increase battery consumption.
                  </p>
                </div>
                <span className={location.natHeartbeats ? "guide-toggle guide-toggle--on" : "guide-toggle"}>
                  <span />
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <span className="location-guide__arrow" aria-hidden="true">→</span>

      <section className="location-step location-step--connection">
        <span className="location-step__badge location-step__badge--blue">
          STEP 2: {location.city} Location ချိတ်ပါ
        </span>
        <div className="connection-shell">
          <div className="connection-status">
            <span className="connection-power" aria-hidden="true">⏻</span>
            <strong>🔒 Protected</strong>
          </div>
          <div className="connection-body">
            <div className="selected-location">
              <div className="selected-location__main">
                <span className="location-flag">{location.flag}</span>
                <div>
                  <small>Selected Location</small>
                  <strong>{location.country} - {location.city}</strong>
                </div>
              </div>
              <span className="selected-location__change">Change ⌖</span>
            </div>
            <div className="connection-ip-block">
              <div className="connection-ip-row">
                <small>VPN IP Address:</small>
                <strong>{location.ip} ↻</strong>
              </div>
              <div className="connection-map" aria-hidden="true">
                <span>▧</span>
                <i />
              </div>
            </div>
            <div className="connection-details">
              <div><small>Time Protected</small><strong>&lt;1h <span>this week</span></strong></div>
              <div className="connection-details__protocol"><small>Protocol (ရွေးချယ်မှု)</small><strong>{location.protocol}</strong></div>
            </div>
            <div className="connection-assistant">
              <span>🛡 Secure Device Assistant</span>
              <strong>3 out of 4</strong>
            </div>
          </div>
        </div>
      </section>
    </motion.article>
  );
}
