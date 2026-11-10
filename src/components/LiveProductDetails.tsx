'use client';
import { useSearchParams } from 'next/navigation';
import { useDetailProducts } from '@/components/CatalogProvider';
import ProductDetailBody from '@/components/ProductDetailBody';
export default function LiveProductDetails(){
 const query=useSearchParams(); const items=useDetailProducts();
 const product=items.find(item=>item.product.id===query.get('product'));
 return <ProductDetailBody slug={product?.slug || ''} />;
}
