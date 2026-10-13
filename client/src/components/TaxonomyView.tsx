import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Tag,
  FolderTree,
} from 'lucide-react';
import type { Category, Attribute } from '../types';

interface TaxonomyViewProps {
  categories: Category[];
  attributes: Attribute[];
  onCreateCategory: (cat: Partial<Category>) => Promise<void>;
  onUpdateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateAttribute: (attr: Partial<Attribute>) => Promise<void>;
  onUpdateAttribute: (id: string, attr: Partial<Attribute>) => Promise<void>;
  onDeleteAttribute: (id: string) => Promise<void>;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({
  categories,
  attributes,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes'>('categories');

  // New Category State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // New Attribute State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [attrName, setAttrName] = useState('');
  const [attrSlug, setAttrSlug] = useState('');
  const [attrOptionsInput, setAttrOptionsInput] = useState('');
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);

  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatDescription(cat.description || '');
    } else {
      setEditingCatId(null);
      setCatName('');
      setCatSlug('');
      setCatDescription('');
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    const slug = catSlug.trim() || catName.toLowerCase().replace(/\s+/g, '-');
    if (editingCatId) {
      await onUpdateCategory(editingCatId, { name: catName.trim(), slug, description: catDescription.trim() });
    } else {
      await onCreateCategory({ name: catName.trim(), slug, description: catDescription.trim() });
    }
    setIsCatModalOpen(false);
  };

  const handleOpenAttributeModal = (attr?: Attribute) => {
    if (attr) {
      setEditingAttrId(attr.id);
      setAttrName(attr.name);
      setAttrSlug(attr.slug);
      setAttrOptionsInput(Array.isArray(attr.options) ? attr.options.join(', ') : '');
    } else {
      setEditingAttrId(null);
      setAttrName('');
      setAttrSlug('');
      setAttrOptionsInput('');
    }
    setIsAttrModalOpen(true);
  };

  const handleSaveAttribute = async () => {
    if (!attrName.trim()) return;
    const slug = attrSlug.trim() || attrName.toLowerCase().replace(/\s+/g, '-');
    const options = attrOptionsInput
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    if (editingAttrId) {
      await onUpdateAttribute(editingAttrId, { name: attrName.trim(), slug, options });
    } else {
      await onCreateAttribute({ name: attrName.trim(), slug, options });
    }
    setIsAttrModalOpen(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Product Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attributes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'attributes'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Global Attributes & Specs ({attributes.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'categories' ? (
            <button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          ) : (
            <button
              onClick={() => handleOpenAttributeModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Attribute
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Categories View */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="Edit Category"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">/{cat.slug}</div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {cat.description || 'No description specified for this category.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>WooCommerce Taxonomy</span>
                <span className="text-purple-600 font-semibold flex items-center gap-1">
                  Active in store
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Attributes View */}
      {activeTab === 'attributes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributes.map(attr => (
            <div
              key={attr.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{attr.name}</h4>
                      <div className="text-[11px] font-mono text-slate-400">spec_slug: {attr.slug}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenAttributeModal(attr)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="Edit Attribute"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAttribute(attr.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Attribute"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Configured Option Values ({attr.options?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(attr.options) && attr.options.length > 0 ? (
                      attr.options.map((opt, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          {opt}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No values defined.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Standardized Global Attribute</span>
                <span className="text-indigo-600 font-semibold">Available for variations</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCatId ? 'Edit Category' : 'Create New Category'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={e => {
                    setCatName(e.target.value);
                    if (!editingCatId) {
                      setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Smart Wearables"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Slug</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={e => setCatSlug(e.target.value)}
                  placeholder="smart-wearables"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={catDescription}
                  onChange={e => setCatDescription(e.target.value)}
                  placeholder="Category description for catalog and SEO..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Create/Edit Modal */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingAttrId ? 'Edit Attribute' : 'Create Global Attribute'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Attribute Name</label>
                <input
                  type="text"
                  value={attrName}
                  onChange={e => {
                    setAttrName(e.target.value);
                    if (!editingAttrId) {
                      setAttrSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Battery Capacity"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Attribute Slug</label>
                <input
                  type="text"
                  value={attrSlug}
                  onChange={e => setAttrSlug(e.target.value)}
                  placeholder="battery-capacity"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Options / Preset Values (Comma-separated)</label>
                <input
                  type="text"
                  value={attrOptionsInput}
                  onChange={e => setAttrOptionsInput(e.target.value)}
                  placeholder="e.g. 500mAh, 1000mAh, 2500mAh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAttrModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttribute}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
              >
                Save Attribute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
