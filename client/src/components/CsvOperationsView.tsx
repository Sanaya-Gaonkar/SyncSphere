import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { csvApi } from '../api';
import { useToast } from '../context/ToastContext';
import type { Category } from '../types';

interface CsvOperationsViewProps {
  categories: Category[];
  onRefreshProducts: () => void;
}

export const CsvOperationsView: React.FC<CsvOperationsViewProps> = ({
  categories,
  onRefreshProducts,
}) => {
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawCsvText, setRawCsvText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportCategory, setExportCategory] = useState('all');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validRows: number;
    errorRows: number;
    rows: Array<{
      rowIndex: number;
      data: any;
      isValid: boolean;
      errors: string[];
    }>;
  } | null>(null);

  // Sample CSV generators
  const sampleValidCsv = `Name,SKU,Regular Price,Sale Price,Stock Quantity,Stock Status,Categories,Description\n"Pro Mechanical Numpad","ACC-NUM-001",39.99,34.99,25,INSTOCK,"Electronics, Accessories","Dedicated wireless numeric keypad with hot-swappable switches."\n"Titanium EDC Carabiner","ACC-EDC-002",24.50,,50,INSTOCK,"Accessories","Lightweight grade-5 titanium carabiner with integrated bottle opener."\n"Ergonomic Memory Foam Wrist Rest","ACC-WR-003",19.99,,40,INSTOCK,"Accessories","Cooling gel-infused ergonomic palm support for full-size mechanical keyboards."`;

  const sampleMixedCsv = `Name,SKU,Regular Price,Sale Price,Stock Quantity,Stock Status,Categories,Description\n"Studio Monitor Desktop Stands","AUD-STD-004",49.99,,15,INSTOCK,"Audio","Acoustic isolation desktop speaker stands."\n"","ERR-NO-NAME",29.99,,10,INSTOCK,"Audio","Product has missing name error."\n"Noise Cancelling Earbuds","AUD-EAR-005",-15.00,,5,INSTOCK,"Audio","Price cannot be negative."\n"Studio Monitor Desktop Stands","AUD-STD-004",49.99,,15,INSTOCK,"Audio","Duplicate SKU within same CSV file."`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRawCsvText('');
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      if (selectedFile) {
        const res = await csvApi.preview(undefined, selectedFile);
        setPreviewData(res);
        success(`Parsed ${res.totalRows} rows: ${res.validRows} valid, ${res.errorRows} errors.`);
      } else if (rawCsvText.trim()) {
        const res = await csvApi.preview(rawCsvText.trim());
        setPreviewData(res);
        success(`Parsed ${res.totalRows} rows: ${res.validRows} valid, ${res.errorRows} errors.`);
      } else {
        warning('Please select a CSV file or paste CSV content first.');
      }
    } catch (err: any) {
      error('Failed to preview CSV', err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteImport = async (onlyValid = true) => {
    if (!previewData) return;
    try {
      setIsImporting(true);
      const rowsToImport = onlyValid
        ? previewData.rows.filter(r => r.isValid)
        : previewData.rows;

      if (rowsToImport.length === 0) {
        warning('No valid rows available to import.');
        return;
      }

      const res = await csvApi.import(rowsToImport, { skipErrors: !onlyValid });
      success(
        `CSV import complete: ${res.importedCount} added, ${res.updatedCount} updated.`,
        res.skippedCount > 0 ? `${res.skippedCount} rows skipped.` : undefined
      );

      setPreviewData(null);
      setSelectedFile(null);
      setRawCsvText('');
      onRefreshProducts();
    } catch (err: any) {
      error('CSV import failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await csvApi.downloadTemplate();
      success('CSV template downloaded.');
    } catch (err: any) {
      error('Template download failed', err.message);
    }
  };

  const handleExport = async (categoryFilter?: string) => {
    const params: Record<string, string> = {};
    if (categoryFilter && categoryFilter !== 'all') {
      params.category = categoryFilter;
    }
    try {
      await csvApi.export(params);
      success('Catalog export downloaded.');
    } catch (err: any) {
      error('Catalog export failed', err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Section: Import / Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Import Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Ingestion via CSV</h3>
                  <p className="text-xs text-slate-500">Upload or paste catalog CSV with row validation.</p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span>CSV Template</span>
              </button>
            </div>

            {/* File Drag/Drop or Select */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-purple-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">
                {selectedFile ? (
                  <span className="text-purple-600 font-bold">{selectedFile.name} (Ready to Preview)</span>
                ) : (
                  'Click to upload CSV or drag and drop file here'
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Accepts UTF-8 encoded .csv files up to 10MB</p>
            </div>

            {/* Quick Sample Load Buttons */}
            <div className="flex items-center gap-2 mt-4 text-xs">
              <span className="text-slate-400 text-[11px]">Quick Tests:</span>
              <button
                type="button"
                onClick={() => {
                  setRawCsvText(sampleValidCsv);
                  setSelectedFile(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
              >
                Load Sample Valid CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setRawCsvText(sampleMixedCsv);
                  setSelectedFile(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium"
              >
                Load CSV with Validation Errors
              </button>
            </div>

            {/* Raw Text Box if no file */}
            {!selectedFile && (
              <textarea
                rows={3}
                value={rawCsvText}
                onChange={e => setRawCsvText(e.target.value)}
                placeholder="Or paste CSV rows directly here..."
                className="mt-3 w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Validates SKU uniqueness, price &gt; 0, and mandatory fields before database write.
            </span>
            <button
              onClick={handlePreview}
              disabled={isPreviewing || (!selectedFile && !rawCsvText.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
              <span>{isPreviewing ? 'Validating...' : 'Validate & Preview'}</span>
            </button>
          </div>
        </div>

        {/* CSV Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Export PIM Catalog</h3>
                <p className="text-xs text-slate-500">Download formatted CSV for backup or marketplace syndication.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <div className="font-semibold text-slate-800">WooCommerce Standard Format</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The generated CSV aligns with WooCommerce native product importer headers (Name, SKU, Regular Price, Sale Price, Stock, Categories, Description).
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Filter Export by Category</label>
                <select
                  value={exportCategory}
                  onChange={e => setExportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
                >
                  <option value="all">All Categories (Full Catalog)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleExport(exportCategory)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Catalog (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Preview Section (when preview data is available) */}
      {previewData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6 animate-in fade-in duration-200">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">CSV Row-Level Validation Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified attributes before committing changes to the primary database.
              </p>
            </div>

            {/* Pill Stats */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-100 font-semibold text-slate-700">
                Total: {previewData.totalRows}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid: {previewData.validRows}
              </span>
              {previewData.errorRows > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Invalid: {previewData.errorRows}
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Row</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">SKU</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Price</th>
                  <th className="py-2.5 px-3 font-semibold">Stock</th>
                  <th className="py-2.5 px-3 font-semibold">Validation Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.rows.map(r => (
                  <tr
                    key={r.rowIndex}
                    className={`hover:bg-slate-50/50 ${!r.isValid ? 'bg-rose-50/30' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400">#{r.rowIndex}</td>
                    <td className="py-2.5 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {r.data.sku || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                      {r.data.name || <span className="text-rose-500 italic">Empty name</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {r.data.regularPrice !== undefined ? `$${r.data.regularPrice}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {r.data.stockQuantity ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">
                      {r.errors && r.errors.length > 0 ? r.errors.join('; ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Execution Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setPreviewData(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Dismiss Preview
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteImport(true)}
                disabled={isImporting || previewData.validRows === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isImporting
                    ? 'Importing...'
                    : `Import ${previewData.validRows} Valid Products`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
