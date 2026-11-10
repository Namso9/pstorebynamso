import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BioscopeGuide from "@/components/BioscopeGuide";

export const metadata: Metadata = {
  title: "Download Bioscope - Premium Store",
  description: "Bioscope downloads for Android, iPhone, iPad, TV, Windows, and Mac.",
};

export default function BioscopeDownloadPage() {
  return (
    <>
      <Header light />
      <main className="info-page bioscope-download-page">
        <div className="info-inner">
          <Link className="info-back" href="/product/bioscope-premium">Back to Bioscope Premium</Link>
          <BioscopeGuide />
        </div>
      </main>
      <Footer />
    </>
  );
}
