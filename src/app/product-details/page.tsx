import { Suspense } from 'react';
import LiveProductDetails from '@/components/LiveProductDetails';
export const metadata={title:'Product - Premium Store'};
export default function Page(){return <Suspense fallback={<p>Loading product...</p>}><LiveProductDetails /></Suspense>;}
