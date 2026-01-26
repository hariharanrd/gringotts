import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';

export type ConfigType = 'CATEGORY' | 'SUBCATEGORY' | 'ITEM';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: ConfigType;
  parentId?: number;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type, 
  parentId 
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'CATEGORY') {
        await api.addCategory({ name, description });
        showToast(`Category saved successfully`, 'success');
      } else if (type === 'SUBCATEGORY' && parentId) {
        await api.addSubCategory({ name, description, categoryId: parentId });
        showToast(`Sub-category saved successfully`, 'success');
      } else if (type === 'ITEM' && parentId) {
        await api.addItem({ name, description, subCategoryId: parentId });
        showToast(`Item saved successfully`, 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(`Failed to save ${type.toLowerCase()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'CATEGORY': return 'New Category';
      case 'SUBCATEGORY': return 'New Sub-Category';
      case 'ITEM': return 'New Item';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-amber-50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-double border-amber-800 font-serif">
        <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between bg-amber-100/50">
          <h3 className="text-lg font-bold text-amber-900">{getTitle()}</h3>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-amber-900">Name</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full px-4 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition-all text-amber-900 placeholder:text-amber-900/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type.toLowerCase()} name`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-amber-900">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none transition-all text-amber-900 placeholder:text-amber-900/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-amber-50 font-semibold rounded-xl shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationModal;
