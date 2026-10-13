import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductCatalogView } from './components/ProductCatalogView';
import { TaxonomyView } from './components/TaxonomyView';
import { SyncCenterView } from './components/SyncCenterView';
import { CsvOperationsView } from './components/CsvOperationsView';
import { WebhooksView } from './components/WebhooksView';
import { AuditTrailView } from './components/AuditTrailView';
import { SettingsView } from './components/SettingsView';
import { ProductModal } from './components/ProductModal';
import { ConflictModal } from './components/ConflictModal';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import {
  productsApi,
  taxonomyApi,
  syncApi,
  settingsApi,
} from './api';
import type {
  Product,
  Category,
  Attribute,
  DashboardStats,
  SyncJob,
  ConflictLog,
  ConflictResolution,
  StoreSettings,
} from './types';

function PIMApp() {
  const { success, error, info } = useToast();

  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [conflicts, setConflicts] = useState<ConflictLog[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictLog | null>(null);

  // Load all master data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        prodsRes,
        catsRes,
        attrsRes,
        statsRes,
        jobsRes,
        confsRes,
        settingsRes,
      ] = await Promise.allSettled([
        productsApi.list({ limit: 100 }),
        taxonomyApi.listCategories(),
        taxonomyApi.listAttributes(),
        productsApi.getStats(),
        syncApi.listJobs(),
        syncApi.listConflicts(),
        settingsApi.get(),
      ]);

      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value?.products || prodsRes.value || []);
      else error('Could not load the product catalog', prodsRes.reason?.message || 'Check that the API server is running.');
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value || []);
      if (attrsRes.status === 'fulfilled') setAttributes(attrsRes.value || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value || null);
      if (jobsRes.status === 'fulfilled') setSyncJobs(jobsRes.value?.jobs || jobsRes.value || []);
      if (confsRes.status === 'fulfilled') setConflicts(confsRes.value || []);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value || null);
    } catch (err: any) {
      console.error('Failed to load PIM data:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Products
  const handleOpenCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>, andSync = false) => {
    try {
      setIsSavingProduct(true);
      let savedProd: Product;
      if (selectedProduct) {
        savedProd = await productsApi.update(selectedProduct.id, productData);
        success(`Product "${savedProd.name}" updated successfully.`);
      } else {
        savedProd = await productsApi.create(productData);
        success(`Product "${savedProd.name}" created.`);
      }

      setIsProductModalOpen(false);

      if (andSync) {
        info('Dispatching product synchronization to WooCommerce...');
        await productsApi.get(savedProd.id); // fresh fetch
        await syncApi.pushSingle(savedProd.id);
        success(`Product "${savedProd.name}" synced to WooCommerce.`);
      }

      await loadData();
    } catch (err: any) {
      error('Failed to save product', err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      await productsApi.duplicate(id);
      success('Product duplicated successfully.');
      await loadData();
    } catch (err: any) {
      error('Failed to duplicate product', err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from the PIM?')) return;
    try {
      await productsApi.delete(id);
      success('Product deleted.');
      await loadData();
    } catch (err: any) {
      error('Failed to delete product', err.message);
    }
  };

  const handleSyncProduct = async (id: string) => {
    try {
      setIsSyncing(true);
      const res = await syncApi.pushSingle(id);
      success(`Product synced to WooCommerce! (Woo ID #${res.remoteId || 'ok'})`);
      await loadData();
    } catch (err: any) {
      error('Sync push failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkSync = async (ids: string[]) => {
    try {
      setIsSyncing(true);
      const res = await syncApi.pushBulk(ids);
      success(`Bulk sync complete: ${res.syncedCount || ids.length} products pushed to WooCommerce.`);
      await loadData();
    } catch (err: any) {
      error('Bulk sync failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllPending = async () => {
    const pending = products.filter(p => p.syncStatus === 'PENDING').map(p => p.id);
    if (pending.length === 0) {
      info('No products currently pending sync.');
      return;
    }
    await handleBulkSync(pending);
  };

  const handleImportWoo = async () => {
    try {
      setIsSyncing(true);
      info('Ingesting products from WooCommerce store...');
      const res = await syncApi.pullProducts();
      const importedCount = res.importedCount || res.count || 0;
      const conflictCount = res.conflictCount || 0;
      success(
        `Store import complete: ${importedCount} products imported or updated.`,
        conflictCount > 0 ? `${conflictCount} products need conflict review.` : undefined
      );
      await loadData();
    } catch (err: any) {
      error('Import from WooCommerce failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await syncApi.retryJob(jobId);
      success('Sync job retried successfully.');
      await loadData();
    } catch (err: any) {
      error('Job retry failed', err.message);
    }
  };

  // Conflict handling
  const handleOpenConflictModal = (conflict: ConflictLog) => {
    setSelectedConflict(conflict);
    setIsConflictModalOpen(true);
  };

  const handleOpenConflictFromProduct = (prod: Product) => {
    const matchingConflict = conflicts.find(c => c.productId === prod.id);
    if (matchingConflict) {
      setSelectedConflict(matchingConflict);
      setIsConflictModalOpen(true);
    } else {
      info('No conflict log details available for this product.');
    }
  };

  const handleResolveConflict = async (
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: any
  ) => {
    try {
      setIsResolvingConflict(true);
      await syncApi.resolveConflict(conflictId, resolution, mergedData);
      success('Conflict resolved successfully.');
      setIsConflictModalOpen(false);
      setSelectedConflict(null);
      await loadData();
    } catch (err: any) {
      error('Failed to resolve conflict', err.message);
    } finally {
      setIsResolvingConflict(false);
    }
  };

  // Taxonomy Handlers
  const handleCreateCategory = async (cat: Partial<Category>) => {
    try {
      await taxonomyApi.createCategory(cat);
      success(`Category "${cat.name}" created.`);
      await loadData();
    } catch (err: any) {
      error('Failed to create category', err.message);
    }
  };

  const handleUpdateCategory = async (id: string, cat: Partial<Category>) => {
    try {
      await taxonomyApi.updateCategory(id, cat);
      success(`Category updated.`);
      await loadData();
    } catch (err: any) {
      error('Failed to update category', err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await taxonomyApi.deleteCategory(id);
      success('Category deleted.');
      await loadData();
    } catch (err: any) {
      error('Failed to delete category', err.message);
    }
  };

  const handleCreateAttribute = async (attr: Partial<Attribute>) => {
    try {
      await taxonomyApi.createAttribute(attr);
      success(`Attribute "${attr.name}" created.`);
      await loadData();
    } catch (err: any) {
      error('Failed to create attribute', err.message);
    }
  };

  const handleUpdateAttribute = async (id: string, attr: Partial<Attribute>) => {
    try {
      await taxonomyApi.updateAttribute(id, attr);
      success(`Attribute updated.`);
      await loadData();
    } catch (err: any) {
      error('Failed to update attribute', err.message);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!window.confirm('Delete attribute?')) return;
    try {
      await taxonomyApi.deleteAttribute(id);
      success('Attribute deleted.');
      await loadData();
    } catch (err: any) {
      error('Failed to delete attribute', err.message);
    }
  };

  const pendingCount = products.filter(p => p.syncStatus === 'PENDING').length;

  return (
    <div className="app-shell flex h-screen overflow-hidden font-sans text-slate-900">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openConflictCount={conflicts.length}
        isDemoMode={settings?.isDemoMode ?? true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header
          currentTab={currentTab}
          onOpenProductModal={handleOpenCreateProduct}
          onSyncAllPending={handleSyncAllPending}
          onImportWoo={handleImportWoo}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          isDemoMode={settings?.isDemoMode ?? true}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Tab Subviews */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loading}
              onNavigate={setCurrentTab}
              onSyncPending={handleSyncAllPending}
              isSyncing={isSyncing}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'catalog' && (
            <ProductCatalogView
              products={products}
              categories={categories}
              loading={loading}
              onOpenCreate={handleOpenCreateProduct}
              onEditProduct={handleEditProduct}
              onDuplicateProduct={handleDuplicateProduct}
              onDeleteProduct={handleDeleteProduct}
              onSyncProduct={handleSyncProduct}
              onBulkSync={handleBulkSync}
              onResolveConflict={handleOpenConflictFromProduct}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {currentTab === 'categories' && (
            <TaxonomyView
              categories={categories}
              attributes={attributes}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onCreateAttribute={handleCreateAttribute}
              onUpdateAttribute={handleUpdateAttribute}
              onDeleteAttribute={handleDeleteAttribute}
            />
          )}

          {currentTab === 'sync' && (
            <SyncCenterView
              jobs={syncJobs}
              conflicts={conflicts}
              onPushBulkPending={handleSyncAllPending}
              onPullWooCommerce={handleImportWoo}
              onRetryJob={handleRetryJob}
              onOpenConflictModal={handleOpenConflictModal}
              onRefresh={loadData}
              isSyncing={isSyncing}
            />
          )}

          {currentTab === 'csv' && (
            <CsvOperationsView
              categories={categories}
              onRefreshProducts={loadData}
            />
          )}

          {currentTab === 'webhooks' && (
            <WebhooksView
              products={products}
              onRefreshProducts={loadData}
            />
          )}

          {currentTab === 'audit' && <AuditTrailView />}

          {currentTab === 'settings' && (
            <SettingsView
              onSettingsSaved={newS => setSettings(newS)}
            />
          )}
        </main>
      </div>

      {/* Global Product Edit / Create Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
        categories={categories}
        isSaving={isSavingProduct}
      />

      {/* Global Conflict Resolution Modal */}
      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflict={selectedConflict}
        onResolve={handleResolveConflict}
        isResolving={isResolvingConflict}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PIMApp />
      </AuthProvider>
    </ToastProvider>
  );
}
