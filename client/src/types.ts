export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
}

export interface AttributeItem {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  regularPrice: number;
  salePrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  stockStatus: 'INSTOCK' | 'OUTOFSTOCK' | 'ONBACKORDER';
  manageStock: boolean;
  categories: string[];
  tags: string[];
  attributes: AttributeItem[];
  images: string[];
  completenessScore: number;
  missingFields: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  syncStatus: 'IN_SYNC' | 'PENDING' | 'ERROR' | 'CONFLICT' | 'DRAFT';
  remoteWooId?: number | null;
  lastSyncedAt?: string | null;
  hasConflict?: boolean;
  conflictDetails?: {
    conflictLogId: string;
    differences: Array<{ field: string; local: any; remote: any }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  remoteWooId?: number | null;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  options: string[];
}

export interface SyncJob {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CONFLICT';
  isSimulated: boolean;
  productId?: string | null;
  affectedCount: number;
  message?: string | null;
  details?: any;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  completedAt?: string | null;
}

export type ConflictResolution = 'KEEP_LOCAL' | 'KEEP_REMOTE' | 'MERGE';

export interface ConflictLog {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  status: 'OPEN' | 'RESOLVED';
  localData: any;
  remoteData: any;
  fieldDifferences: Array<{ field: string; local: any; remote: any }>;
  resolutionType?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  eventName: string;
  payload: any;
  signature?: string;
  signatureVerified: boolean;
  status: 'PROCESSED' | 'DUPLICATE' | 'FAILED';
  processedAt: string;
  error?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret?: string;
  consumerSecretMasked?: string;
  apiVersion: string;
  verifySsl: boolean;
  webhookSecret: string;
  isDemoMode: boolean;
  autoSyncOnSave: boolean;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  syncedCount: number;
  pendingCount: number;
  conflictCount: number;
  errorCount: number;
  draftCount: number;
  averageCompleteness: number;
  completenessBreakdown: {
    missingImages: number;
    missingDescriptions: number;
    missingPrices: number;
    missingCategories: number;
  };
  categoryDistribution: Array<{ name: string; count: number }>;
  recentJobs: SyncJob[];
  recentAudit: AuditLog[];
}
