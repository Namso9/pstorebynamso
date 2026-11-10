import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WebsiteOrder from "@/components/WebsiteOrder";
export const metadata={title:"Order - Premium Store",robots:{index:false,follow:true}};
export default function Page(){return <><Header light /><main className="info-page"><Suspense fallback={null}><WebsiteOrder /></Suspense></main><Footer /></>;}
