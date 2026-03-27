import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ToastContext';

export type ConfigType = 'CATEGORY' | 'SUBCATEGORY' | 'ITEM';

export interface EditData {
  id: number;
  name: string;
  description: string;
}

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: ConfigType;
  parentId?: number;
  editData?: EditData | null;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type, 
  parentId,
  editData 
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setName(editData.name);
        setDescription(editData.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        if (type === 'CATEGORY') {
          await api.updateCategory({ id: editData!.id, name, description });
          showToast('Category updated successfully', 'success');
        } else if (type === 'SUBCATEGORY') {
          await api.updateSubCategory({ id: editData!.id, name, description });
          showToast('Sub-category updated successfully', 'success');
        } else if (type === 'ITEM') {
          await api.updateItem({ id: editData!.id, name, description });
          showToast('Item updated successfully', 'success');
        }
      } else {
        if (type === 'CATEGORY') {
          await api.addCategory({ name, description });
          showToast('Category saved successfully', 'success');
        } else if (type === 'SUBCATEGORY' && parentId) {
          await api.addSubCategory({ name, description, categoryId: parentId });
          showToast('Sub-category saved successfully', 'success');
        } else if (type === 'ITEM' && parentId) {
          await api.addItem({ name, description, subCategoryId: parentId });
          showToast('Item saved successfully', 'success');
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const action = isEditing ? 'update' : 'save';
      showToast(`Failed to ${action} ${type.toLowerCase()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    const prefix = isEditing ? 'Edit' : 'New';
    switch (type) {
      case 'CATEGORY': return `${prefix} Category`;
      case 'SUBCATEGORY': return `${prefix} Sub-Category`;
      case 'ITEM': return `${prefix} Item`;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl shadow-black/40 overflow-hidden border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type.toLowerCase()} name`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all text-white placeholder:text-slate-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700/50"
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
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update' : 'Save'}
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
