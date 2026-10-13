import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Sparkles,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Product, Category } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>, andSync?: boolean) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  isSaving?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  isSaving = false,
}) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [regularPrice, setRegularPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockStatus, setStockStatus] = useState<'INSTOCK' | 'OUTOFSTOCK' | 'ONBACKORDER'>('INSTOCK');
  const [manageStock, setManageStock] = useState(true);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [attributes, setAttributes] = useState<Array<{ name: string; values: string[] }>>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Populate or reset state on product prop change
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setSlug(product.slug || '');
      setRegularPrice(product.regularPrice ?? '');
      setSalePrice(product.salePrice ?? '');
      setCostPrice(product.costPrice ?? '');
      setStockQuantity(product.stockQuantity ?? 0);
      setStockStatus(product.stockStatus || 'INSTOCK');
      setManageStock(product.manageStock ?? true);
      setStatus(product.status || 'PUBLISHED');
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setSelectedCategories(Array.isArray(product.categories) ? product.categories : []);
      setTags(Array.isArray(product.tags) ? product.tags : []);
      setImageUrls(Array.isArray(product.images) ? product.images : []);
      setAttributes(Array.isArray(product.attributes) ? product.attributes : []);
    } else {
      setName('');
      setSku('');
      setSlug('');
      setRegularPrice('');
      setSalePrice('');
      setCostPrice('');
      setStockQuantity(10);
      setStockStatus('INSTOCK');
      setManageStock(true);
      setStatus('PUBLISHED');
      setShortDescription('');
      setDescription('');
      setSelectedCategories([]);
      setTags([]);
      setImageUrls([]);
      setAttributes([]);
    }
  }, [product, isOpen]);

  // Auto-slug generator when name changes if creating
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  // Live completeness calculation
  const missingFields: string[] = [];
  if (!name.trim()) missingFields.push('Name');
  if (!sku.trim()) missingFields.push('SKU');
  if (regularPrice === '' || Number(regularPrice) <= 0) missingFields.push('Price');
  if (!description.trim()) missingFields.push('Description');
  if (imageUrls.length === 0) missingFields.push('Images');
  if (selectedCategories.length === 0) missingFields.push('Category');

  const totalChecks = 6;
  const completedChecks = totalChecks - missingFields.length;
  const liveCompleteness = Math.round((completedChecks / totalChecks) * 100);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleToggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handleAddAttribute = () => {
    if (newAttrName.trim() && newAttrValue.trim()) {
      const vals = newAttrValue.split(',').map(v => v.trim()).filter(Boolean);
      setAttributes(prev => [...prev, { name: newAttrName.trim(), values: vals }]);
      setNewAttrName('');
      setNewAttrValue('');
    }
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (andSync = false) => {
    if (!name.trim() || !sku.trim() || regularPrice === '') {
      alert('Please fill in required fields: Name, SKU, and Regular Price.');
      return;
    }

    const payload: Partial<Product> = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
      regularPrice: Number(regularPrice),
      salePrice: salePrice !== '' ? Number(salePrice) : null,
      costPrice: costPrice !== '' ? Number(costPrice) : null,
      stockQuantity: Number(stockQuantity),
      stockStatus,
      manageStock,
      status,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categories: selectedCategories,
      tags,
      images: imageUrls,
      attributes,
    };

    await onSave(payload, andSync);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? `Edit Product: ${product?.name}` : 'Create New Product'}
                </h3>
                {product?.remoteWooId && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Woo ID #{product.remoteWooId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Synchronized with WooCommerce catalog & inventory schemas.
              </p>
            </div>
          </div>

          {/* Completeness Badge & Close */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Completeness</div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span
                  className={
                    liveCompleteness >= 80
                      ? 'text-emerald-600'
                      : liveCompleteness >= 50
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }
                >
                  {liveCompleteness}%
                </span>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      liveCompleteness >= 80
                        ? 'bg-emerald-500'
                        : liveCompleteness >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${liveCompleteness}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Missing fields notification banner */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Missing for 100% Completeness: </span>
              <span className="font-semibold">{missingFields.join(', ')}</span>
            </div>
            <span className="text-[11px] text-amber-600">Omnichannel readiness rating</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-purple-600" /> General Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Ergonomic Mechanical Keyboard RGB"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value.toUpperCase())}
                  placeholder="KB-MECH-001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white uppercase font-mono"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="ergonomic-mechanical-keyboard-rgb"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Publication Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="PUBLISHED">Published (Ready for Store)</option>
                  <option value="DRAFT">Draft (Internal Only)</option>
                  <option value="ARCHIVED">Archived (Discontinued)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Inventory */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Pricing & Inventory
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Regular Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regularPrice}
                  onChange={e => setRegularPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="89.99"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Sale Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="69.99"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="35.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(Number(e.target.value))}
                  placeholder="10"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Stock Status</label>
                <select
                  value={stockStatus}
                  onChange={e => setStockStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="INSTOCK">In Stock</option>
                  <option value="OUTOFSTOCK">Out of Stock</option>
                  <option value="ONBACKORDER">On Backorder</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="manageStock"
                  checked={manageStock}
                  onChange={e => setManageStock(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="manageStock" className="font-medium text-slate-700 cursor-pointer">
                  Manage stock levels automatically at product level in WooCommerce
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Descriptions */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Descriptions & Marketing
            </h4>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Short Summary Description</label>
              <input
                type="text"
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                placeholder="Brief one-line teaser displayed above buy box..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Product Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Comprehensive technical specifications, features, warranty, and buyer benefits..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white resize-y"
              />
            </div>
          </div>

          {/* Section 4: Taxonomies (Categories & Tags) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" /> Categories & Tags
            </h4>

            <div>
              <label className="font-semibold text-slate-700 block mb-2">Categories (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="font-semibold text-slate-700">Tags (Press Enter to add)</label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-white min-h-[42px]">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter..."
                  className="flex-1 min-w-[140px] border-none bg-transparent focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Gallery Images */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> Media Gallery
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... or CDN URL"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add URL
              </button>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs"
                  >
                    <img
                      src={url}
                      alt={`Product preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as any).src =
                          'https://placehold.co/200x200?text=Invalid+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Attributes & Specifications */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Attributes & Product Specs
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newAttrName}
                onChange={e => setNewAttrName(e.target.value)}
                placeholder="Attribute (e.g. Color, Size)"
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
              <input
                type="text"
                value={newAttrValue}
                onChange={e => setNewAttrValue(e.target.value)}
                placeholder="Values (comma-separated, e.g. Black, White)"
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Spec
              </button>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{attr.name}: </span>
                      <span className="text-slate-600">{attr.values.join(', ')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Save & Sync to Woo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
