import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Edit,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { Product, Category } from '../types';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const productImageFallback = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dbeafe"/><stop offset="1" stop-color="#eff6ff"/></linearGradient></defs><rect width="100" height="100" rx="16" fill="url(#g)"/><path d="M28 39h44l-4 35H32zm8-4a14 14 0 0 1 28 0" fill="none" stroke="#2563eb" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/></svg>'
)}`;

interface ProductCatalogViewProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onOpenCreate: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct: (id: string) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSyncProduct: (id: string) => Promise<void>;
  onBulkSync: (ids: string[]) => Promise<void>;
  onResolveConflict: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  categories,
  loading,
  onOpenCreate,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onSyncProduct,
  onBulkSync,
  onResolveConflict,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'price' | 'completeness'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name?.toLowerCase().includes(q);
          const matchesSku = p.sku?.toLowerCase().includes(q);
          const matchesTag = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q));
          if (!matchesName && !matchesSku && !matchesTag) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (!Array.isArray(p.categories) || !p.categories.includes(selectedCategory)) {
            return false;
          }
        }

        // Sync status filter
        if (selectedSyncStatus !== 'all') {
          if (p.syncStatus !== selectedSyncStatus) return false;
        }

        // Stock status filter
        if (selectedStockStatus !== 'all') {
          if (p.stockStatus !== selectedStockStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a.updatedAt;
        let valB: any = b.updatedAt;

        if (sortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === 'price') {
          valA = a.regularPrice;
          valB = b.regularPrice;
        } else if (sortBy === 'completeness') {
          valA = a.completenessScore;
          valB = b.completenessScore;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedSyncStatus, selectedStockStatus, sortBy, sortOrder]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkSyncTrigger = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkSyncing(true);
      await onBulkSync(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const handleSingleSync = async (id: string) => {
    try {
      setSyncingId(id);
      await onSyncProduct(id);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or tag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Quick Stats & Create Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <Filter className="w-3 h-3 text-purple-600" /> Filters:
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none text-xs font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sync Status Dropdown */}
          <select
            value={selectedSyncStatus}
            onChange={e => setSelectedSyncStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none text-xs font-medium"
          >
            <option value="all">All Sync Statuses</option>
            <option value="IN_SYNC">In Sync (Live)</option>
            <option value="PENDING">Pending Sync</option>
            <option value="CONFLICT">Has Conflict</option>
            <option value="ERROR">Sync Error</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Stock Status Dropdown */}
          <select
            value={selectedStockStatus}
            onChange={e => setSelectedStockStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none text-xs font-medium"
          >
            <option value="all">All Stock Statuses</option>
            <option value="INSTOCK">In Stock</option>
            <option value="OUTOFSTOCK">Out of Stock</option>
            <option value="ONBACKORDER">On Backorder</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none text-xs font-medium"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="name">Product Name</option>
              <option value="price">Regular Price</option>
              <option value="completeness">Completeness Score</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Banner (when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-cyan-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'product' : 'products'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-cyan-600 hover:underline"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkSyncTrigger}
              disabled={isBulkSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span>{isBulkSyncing ? 'Pushing to Woo...' : 'Push Selected to WooCommerce'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-purple-600 focus:outline-none"
                  >
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Pricing</th>
                <th className="py-3 px-4 font-semibold">Inventory</th>
                <th className="py-3 px-4 font-semibold">Categories</th>
                <th className="py-3 px-4 font-semibold">Completeness</th>
                <th className="py-3 px-4 font-semibold">Sync Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading products catalog...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || selectedCategory !== 'all' || selectedSyncStatus !== 'all'
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Click "Add Product" above to build your omnichannel catalog.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  const isSyncingThis = syncingId === p.id;
                  const firstImg = Array.isArray(p.images) && p.images[0];

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="text-slate-400 hover:text-purple-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {firstImg ? (
                              <img
                                src={firstImg}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = productImageFallback;
                                }}
                              />
                            ) : (
                              <span className="text-slate-400 font-bold text-xs uppercase">
                                {p.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => onEditProduct(p)}
                              className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer truncate max-w-xs"
                              title={p.name}
                            >
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                              /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {p.sku}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4">
                        <div>
                          {p.salePrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-600">
                                {formatPrice(p.salePrice)}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatPrice(p.regularPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-900">
                              {formatPrice(p.regularPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Inventory */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.stockStatus === 'INSTOCK'
                                ? 'bg-emerald-500'
                                : p.stockStatus === 'ONBACKORDER'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-medium text-slate-800">
                            {p.stockQuantity} units
                          </span>
                        </div>
                      </td>

                      {/* Categories */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {Array.isArray(p.categories) && p.categories.length > 0 ? (
                            p.categories.slice(0, 2).map(c => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Unassigned</span>
                          )}
                          {Array.isArray(p.categories) && p.categories.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{p.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Completeness */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              p.completenessScore >= 80
                                ? 'text-emerald-600'
                                : p.completenessScore >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {p.completenessScore}%
                          </span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.completenessScore >= 80
                                ? 'bg-emerald-500'
                                : p.completenessScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              }`}
                              style={{ width: `${p.completenessScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Sync Status */}
                      <td className="py-3 px-4">
                        <div>
                          {p.syncStatus === 'IN_SYNC' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Sync
                              {p.remoteWooId && ` (#${p.remoteWooId})`}
                            </span>
                          )}

                          {p.syncStatus === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending
                            </span>
                          )}

                          {p.syncStatus === 'CONFLICT' && (
                            <button
                              onClick={() => onResolveConflict(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Conflict
                            </button>
                          )}

                          {p.syncStatus === 'ERROR' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Error
                            </span>
                          )}

                          {p.syncStatus === 'DRAFT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Draft
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Push Single */}
                          <button
                            onClick={() => handleSingleSync(p.id)}
                            disabled={isSyncingThis}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                            title="Sync to WooCommerce"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-purple-600' : ''}`}
                            />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {filteredProducts.length} of {products.length} products
          </div>
          <div>All catalog records persist with SQLite and ACID consistency.</div>
        </div>
      </div>
    </div>
  );
};
