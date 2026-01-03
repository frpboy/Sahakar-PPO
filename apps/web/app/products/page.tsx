'use client';
import { Info, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductsPlaceholder() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="saas-card p-12 bg-white text-center max-w-md flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Package size={32} className="text-brand-600" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900 mb-2">Global Product Catalog</h1>
                <p className="text-sm text-neutral-500 mb-8">We are indexing 100k+ SKU mappings from the ERP. The product management terminal will be available post-sync.</p>
                <button className="btn-brand w-full" onClick={() => router.back()}>Return to Dashboard</button>
            </div>
        </div>
    );
}
