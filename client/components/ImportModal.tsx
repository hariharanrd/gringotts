import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from './ToastContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>('HDFC');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      showToast('Transactions imported successfully', 'success');
      onSuccess();
      onClose();
      setFile(null);
    } catch (error) {
      console.error(error);
      showToast('Failed to import transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center p-4">
      <div className="my-auto bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Statement</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Statement Source</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="HDFC">HDFC Bank</option>
              <option value="APayCC">Amazon Pay ICICI</option>
              <option value="HDFCCC">HDFC Credit Card</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Statement File</label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-cyan-500/30 transition-all group cursor-pointer">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                {file ? (
                  <>
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">{file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Click or drag file here</span>
                    <span className="text-xs text-slate-400 dark:text-slate-600">CSV, XLSX, XLS</span>
                  </>
                )}
              </div>
            </div>
          </div>

          </div>

          <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportModal;