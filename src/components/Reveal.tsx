"use client";

// Keep section content visible in the exported HTML and during hydration.
export default function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <div className="reveal">
      {children}
    </div>
  );
}
