
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Tag, 
  Layers, 
  Package 
} from 'lucide-react';
import { api } from '../services/api';
import { Category, SubCategory, Item } from '../types';
import ConfigurationModal, { ConfigType } from '../components/ConfigurationModal';
import ConfirmationDialog from '../components/ConfirmationDialogue';
import { useToast } from '../components/ToastContext';

const Configuration: React.FC = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<number, SubCategory[]>>({});
  const [items, setItems] = useState<Record<number, Item[]>>({});
  
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfigType>('CATEGORY');
  const [modalParentId, setModalParentId] = useState<number | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ConfigType, id: number, parentId?: number } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await api.getCategories();
    setCategories(data);
  };

  const toggleCategory = async (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      if (!subCategories[categoryId]) {
        setLoading(prev => ({ ...prev, [`cat-${categoryId}`]: true }));
        try {
          const subs = await api.getSubCategories(categoryId);
          setSubCategories(prev => ({ ...prev, [categoryId]: subs }));
        } catch (error) {
          console.error("Failed to load subcategories", error);
        } finally {
          setLoading(prev => ({ ...prev, [`cat-${categoryId}`]: false }));
        }
      }
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = async (subCategoryId: number) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(subCategoryId)) {
      newExpanded.delete(subCategoryId);
    } else {
      newExpanded.add(subCategoryId);
      if (!items[subCategoryId]) {
        setLoading(prev => ({ ...prev, [`sub-${subCategoryId}`]: true }));
        try {
          const its = await api.getItems(subCategoryId);
          setItems(prev => ({ ...prev, [subCategoryId]: its }));
        } catch (error) {
          console.error("Failed to load items", error);
        } finally {
          setLoading(prev => ({ ...prev, [`sub-${subCategoryId}`]: false }));
        }
      }
    }
    setExpandedSubCategories(newExpanded);
  };

  const handleDeleteCategory = (id: number) => {
    setDeleteTarget({ type: 'CATEGORY', id });
  };

  const handleDeleteSubCategory = (id: number, categoryId: number) => {
    setDeleteTarget({ type: 'SUBCATEGORY', id, parentId: categoryId });
  };

  const handleDeleteItem = (id: number, subCategoryId: number) => {
    setDeleteTarget({ type: 'ITEM', id, parentId: subCategoryId });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, parentId } = deleteTarget;

    try {
      if (type === 'CATEGORY') {
        await (api as any).deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
        showToast('Category deleted successfully', 'success');
      } else if (type === 'SUBCATEGORY' && parentId) {
        await (api as any).deleteSubCategory(id);
        setSubCategories(prev => ({
          ...prev,
          [parentId]: prev[parentId].filter(s => s.id !== id)
        }));
        showToast('Sub-category deleted successfully', 'success');
      } else if (type === 'ITEM' && parentId) {
        await (api as any).deleteItem(id);
        setItems(prev => ({
          ...prev,
          [parentId]: prev[parentId].filter(i => i.id !== id)
        }));
        showToast('Item deleted successfully', 'success');
      }
    } catch (error) {
      console.error(`Failed to delete ${type.toLowerCase()}`, error);
      showToast(`Failed to delete ${type.toLowerCase()}`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openModal = (type: ConfigType, parentId?: number) => {
    setModalType(type);
    setModalParentId(parentId);
    setModalOpen(true);
  };

  const handleModalSuccess = async () => {
    if (modalType === 'CATEGORY') {
      loadCategories();
    } else if (modalType === 'SUBCATEGORY' && modalParentId) {
      const subs = await api.getSubCategories(modalParentId);
      setSubCategories(prev => ({ ...prev, [modalParentId]: subs }));
      if (!expandedCategories.has(modalParentId)) {
        setExpandedCategories(prev => new Set(prev).add(modalParentId));
      }
    } else if (modalType === 'ITEM' && modalParentId) {
      const its = await api.getItems(modalParentId);
      setItems(prev => ({ ...prev, [modalParentId]: its }));
      if (!expandedSubCategories.has(modalParentId)) {
        setExpandedSubCategories(prev => new Set(prev).add(modalParentId));
      }
    }
  };

  const getDeleteMessage = () => {
    switch (deleteTarget?.type) {
      case 'CATEGORY':
        return 'Are you sure? This will delete all subcategories and items within it.';
      case 'SUBCATEGORY':
        return 'Are you sure? This will delete all items within it.';
      case 'ITEM':
        return 'Are you sure you want to delete this item?';
      default:
        return 'Are you sure?';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Categories & Items</h2>
        </div>

        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.id} className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-800/30">
              <div 
                className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors cursor-pointer select-none"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Tag className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200">{category.name}</h3>
                    {category.description && <p className="text-xs text-slate-500">{category.description}</p>}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                  className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="border-t border-slate-700/30">
                  {loading[`cat-${category.id}`] ? (
                    <div className="p-4 text-center text-slate-500 text-sm animate-pulse">Loading subcategories...</div>
                  ) : (
                    <div className="p-2 pl-8 space-y-2">
                      {subCategories[category.id]?.map(sub => (
                        <div key={sub.id} className="border border-slate-700/30 rounded-lg overflow-hidden bg-slate-800/20">
                          <div 
                            className="flex items-center justify-between p-3 hover:bg-slate-700/20 transition-colors cursor-pointer select-none"
                            onClick={() => toggleSubCategory(sub.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedSubCategories.has(sub.id) ? (
                                <ChevronDown className="w-3.5 h-3.5 text-violet-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <Layers className="w-4 h-4 text-violet-400" />
                              <span className="text-sm font-medium text-slate-300">{sub.name}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSubCategory(sub.id, category.id); }}
                              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Sub-Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {expandedSubCategories.has(sub.id) && (
                            <div className="border-t border-slate-700/20 p-2 pl-8">
                              {loading[`sub-${sub.id}`] ? (
                                <div className="py-2 text-slate-500 text-xs animate-pulse">Loading items...</div>
                              ) : (
                                <div className="space-y-1">
                                  {items[sub.id]?.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/20 transition-all group">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-sm text-slate-300">{item.name}</span>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteItem(item.id, sub.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                                        title="Delete Item"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => openModal('ITEM', sub.id)}
                                    className="w-full mt-2 py-1.5 text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg border border-dashed border-slate-700/50 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Item
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={() => openModal('SUBCATEGORY', category.id)}
                        className="w-full py-2 text-sm text-slate-500 hover:text-violet-400 hover:bg-violet-500/5 rounded-lg border border-dashed border-slate-700/50 hover:border-violet-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Sub-Category
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No categories found. Click "Add Category" to start.
            </div>
          )}
          <button 
            onClick={() => openModal('CATEGORY')}
            className="w-full py-3 text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-xl border border-dashed border-slate-700/50 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <ConfigurationModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        type={modalType}
        parentId={modalParentId}
      />

      <ConfirmationDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={`Delete ${deleteTarget?.type === 'SUBCATEGORY' ? 'Sub-Category' : deleteTarget?.type === 'CATEGORY' ? 'Category' : 'Item'}`}
        message={getDeleteMessage()}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Configuration;
