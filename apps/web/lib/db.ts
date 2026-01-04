import Dexie, { Table } from 'dexie';

// Offline data models
export interface CachedProduct {
    id: string;
    legacyId?: string;
    productCode?: string;
    itemName: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    mrp?: number;
    active: boolean;
    cachedAt: number;
}

export interface CachedSupplier {
    id: string;
    supplierCode?: string;
    supplierName: string;
    contactPerson?: string;
    mobile?: string;
    email?: string;
    active: boolean;
    cachedAt: number;
}

export interface SyncQueueItem {
    id?: number;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    payload: any;
    createdAt: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed';
}

export interface OrderSlipCache {
    id: string;
    supplierId: string;
    slipDate: string;
    generatedBy: string;
    items: any[];
    cachedAt: number;
}

export class SahakarDB extends Dexie {
    products!: Table<CachedProduct, string>;
    suppliers!: Table<CachedSupplier, string>;
    syncQueue!: Table<SyncQueueItem, number>;
    orderSlips!: Table<OrderSlipCache, string>;

    constructor() {
        super('SahakarPPO');

        this.version(1).stores({
            products: 'id, legacyId, itemName, category, cachedAt',
            suppliers: 'id, supplierCode, supplierName, cachedAt',
            syncQueue: '++id, endpoint, status, createdAt',
            orderSlips: 'id, supplierId, slipDate, cachedAt'
        });
    }
}

export const db = new SahakarDB();
