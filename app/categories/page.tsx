'use client';

import { useState, useEffect } from 'react';
import {
  getCategoriesAndUnitsData,
  addCategory,
  updateCategory,
  deleteCategory,
  addUnit,
  updateUnit,
  deleteUnit,
} from '@/app/actions/categories';
import { Tags, Scale, Plus, Trash2, Layers, Edit2, X, CheckCircle, FolderTree, Ruler, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Edit State Modals
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);

  const loadData = async () => {
    const data = await getCategoriesAndUnitsData();
    setCategories(data.categories);
    setUnits(data.units);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recursive function to generate flat hierarchical options for dropdowns with depth indicators
  const getCategoryOptions = (cats: any[], parentId: string | null = null, level = 0): any[] => {
    let options: any[] = [];
    cats.filter(c => c.parentId === parentId).forEach(cat => {
      options.push({ ...cat, level });
      options = options.concat(getCategoryOptions(cats, cat.id, level + 1));
    });
    return options;
  };

  const flatCategoryOptions = getCategoryOptions(categories);

  // Recursive function to render multi-level tree list in UI
  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    const currentLevelCategories = categories.filter(c => (parentId === null ? !c.parentId : c.parentId === parentId));

    if (currentLevelCategories.length === 0) return null;

    return (
      <div className={`space-y-2 ${level > 0 ? 'ml-5 mt-2 border-l-2 border-indigo-100 pl-3' : ''}`}>
        {currentLevelCategories.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-sm hover:border-indigo-200 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {level > 0 && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  level === 0 ? 'bg-emerald-50 text-emerald-600' : level === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {level === 0 ? 'Main Category' : level === 1 ? 'Sub-Category' : `Sub-Sub (${level + 1})`}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingCategory(c)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <form action={async () => { await deleteCategory(c.id); loadData(); }}>
                  <button
                    type="submit"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Recursively render child categories inside this category */}
            {renderCategoryTree(c.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  // Stats
  const totalCategories = categories.length;
  const totalUnits = units.length;
  const totalMainCategories = categories.filter(c => !c.parentId).length;
  const totalSubCategories = categories.filter(c => c.parentId).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-indigo-600" />
              Categories & Measurement Units
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage multi-level fabric categories, sub-categories, and custom sale units
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Light Theme */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Categories', value: totalCategories, icon: Tags, color: 'indigo' },
          { label: 'Main Categories', value: totalMainCategories, icon: FolderTree, color: 'blue' },
          { label: 'Sub Categories', value: totalSubCategories, icon: Layers, color: 'purple' },
          { label: 'Measurement Units', value: totalUnits, icon: Ruler, color: 'emerald' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
              </div>
              <div className={`p-2.5 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: CATEGORIES MANAGEMENT */}
        <div className="space-y-5">
          {/* Add Category Form - Light Theme */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tags className="w-5 h-5 text-indigo-600" /> 
              Add Category / Sub-Category
            </h2>

            <form action={async (formData) => { await addCategory(formData); loadData(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Cotton, Premium Lawn, Men Unstitched"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Parent Category (Optional - Select to nest inside any level)
                </label>
                <select
                  name="parentId"
                  defaultValue="NONE"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                >
                  <option value="NONE">-- None (This is Main Category) --</option>
                  {flatCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {'-'.repeat(c.level * 3)} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/50"
              >
                <Plus className="w-4 h-4" /> Save Category
              </button>
            </form>
          </div>

          {/* Categories Tree List - Light Theme */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 bg-slate-50/80">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> 
                Multi-level Categories Tree
                <span className="ml-auto text-xs font-normal text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {categories.length}
                </span>
              </h3>
            </div>

            <div className="p-4 max-h-[450px] overflow-y-auto">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tags className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">No categories added yet</p>
                  <p className="text-xs text-slate-400">Add your first category above</p>
                </div>
              ) : (
                renderCategoryTree(null)
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UNITS MANAGEMENT */}
        <div className="space-y-5">
          {/* Add Unit Form - Light Theme */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" /> 
              Add Measurement Unit
            </h2>

            <form action={async (formData) => { await addUnit(formData); loadData(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Unit Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Meter, Yard, Suit"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Short Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shortCode"
                    required
                    placeholder="e.g. m, yd, st"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 transition-all hover:shadow-emerald-300/50"
              >
                <Plus className="w-4 h-4" /> Save Measurement Unit
              </button>
            </form>
          </div>

          {/* Units List - Light Theme */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 bg-slate-50/80">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" /> 
                Active Measurement Units
                <span className="ml-auto text-xs font-normal text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {units.length}
                </span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {units.length === 0 ? (
                <div className="text-center py-12">
                  <Ruler className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">No units added yet</p>
                  <p className="text-xs text-slate-400">Add your first unit above</p>
                </div>
              ) : (
                units.map((u) => (
                  <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-mono text-xs font-bold border border-indigo-200">
                        {u.shortCode}
                      </span>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingUnit(u)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Unit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <form action={async () => { await deleteUnit(u.id); loadData(); }}>
                        <button
                          type="submit"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT CATEGORY MODAL - Light Theme */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl border border-slate-200/60">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Edit2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  Edit Category
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update category details</p>
              </div>
              <button 
                onClick={() => setEditingCategory(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={async (formData) => { await updateCategory(formData); setEditingCategory(null); loadData(); }} className="space-y-4">
              <input type="hidden" name="id" value={editingCategory.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Parent Category
                </label>
                <select
                  name="parentId"
                  defaultValue={editingCategory.parentId || 'NONE'}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                >
                  <option value="NONE">-- None (This is Main Category) --</option>
                  {flatCategoryOptions.filter(c => c.id !== editingCategory.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {'-'.repeat(c.level * 3)} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT UNIT MODAL - Light Theme */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl border border-slate-200/60">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  Edit Measurement Unit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update unit details</p>
              </div>
              <button 
                onClick={() => setEditingUnit(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={async (formData) => { await updateUnit(formData); setEditingUnit(null); loadData(); }} className="space-y-4">
              <input type="hidden" name="id" value={editingUnit.id} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Unit Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUnit.name}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Short Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shortCode"
                    defaultValue={editingUnit.shortCode}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}