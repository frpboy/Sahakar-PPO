import Dexie, { Table } from 'dexie';

export interface PendingOrder {
    id?: number;
    remoteId?: string;
    productName: string;
    quantity: number;
    status: string;
    updatedAt: number;
    meta?: any;
}

export interface OrderSlip {
    id?: number;
    remoteId?: string;
    orderId: string;
    status: string;
    totalAmount: number;
    updatedAt: number;
}

export interface SyncOperation {
    id?: number;
    type: 'order_update' | 'slip_update' | 'rep_allocation' | 'ppo_import';
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    priority: number; // 0 low, 1 normal, 2 high
    createdAt: number;
}

export class SahakarDatabase extends Dexie {
    pendingOrders!: Table<PendingOrder>;
    orderSlips!: Table<OrderSlip>;
    syncQueue!: Table<SyncOperation>;

    constructor() {
        super('SahakarPPO');
        this.version(1).stores({
            pendingOrders: '++id, remoteId, productName, status, updatedAt',
            orderSlips: '++id, remoteId, orderId, status, updatedAt',
            syncQueue: '++id, type, action, priority, createdAt'
        });
    }
}

export const db = new SahakarDatabase();
