export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
}

export interface AttributeItem {
  name: string;
  values: string[];
}

export interface ProductFormData {
  name: string;
  sku: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  regularPrice: number;
  salePrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  stockStatus: 'INSTOCK' | 'OUTOFSTOCK' | 'ONBACKORDER';
  manageStock?: boolean;
  categories: string[];
  tags: string[];
  attributes: AttributeItem[];
  images: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CompletenessResult {
  score: number;
  missingFields: string[];
  recommendations: string[];
}

export interface WooProductPayload {
  name: string;
  type?: string;
  regular_price: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  sku: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: string;
  categories?: Array<{ id?: number; name?: string }>;
  tags?: Array<{ id?: number; name?: string }>;
  images?: Array<{ src: string }>;
  attributes?: Array<{
    name: string;
    visible?: boolean;
    variation?: boolean;
    options: string[];
  }>;
}

export interface SyncResult {
  success: boolean;
  jobId: string;
  status: 'SUCCESS' | 'FAILED' | 'CONFLICT';
  affectedCount: number;
  message: string;
  details?: Record<string, any>;
  hasConflict?: boolean;
  conflictData?: {
    productId: string;
    localData: any;
    remoteData: any;
    differences: Array<{ field: string; local: any; remote: any }>;
  };
}

export interface CSVRowData {
  Name?: string;
  SKU?: string;
  'Regular Price'?: string;
  'Sale Price'?: string;
  'Stock Quantity'?: string;
  'Stock Status'?: string;
  Categories?: string;
  Tags?: string;
  'Short Description'?: string;
  Description?: string;
  Images?: string;
  Attributes?: string;
  Status?: string;
  [key: string]: string | undefined;
}

export interface CSVParseResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: Array<{
    rowIndex: number;
    data: any;
    isValid: boolean;
    errors: string[];
  }>;
  columnHeaders: string[];
}
