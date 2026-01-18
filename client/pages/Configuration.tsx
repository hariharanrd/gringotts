
import React, { useState, useEffect } from 'react';
import { Plus, Tag, Layers, Package, Trash2, Search } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';

const Configuration: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'category' | 'subcategory' | 'item'>('category');

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
        {[
          { id: 'category', label: 'Categories', icon: Tag },
          { id: 'subcategory', label: 'Sub-Categories', icon: Layers },
          { id: 'item', label: 'Items', icon: Package },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">Manage {activeTab}s</h3>
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">
              {categories.length}
            </span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all">
            <Plus className="w-4 h-4" />
            Add {activeTab}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {categories.map((c) => (
            <div key={c.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div>
                <h4 className="font-bold text-slate-900">{c.name}</h4>
                <p className="text-sm text-slate-500">{c.description || 'No description provided.'}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Configuration;
