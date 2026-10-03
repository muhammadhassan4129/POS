'use client';

import { useEffect, useState } from 'react';
import { getInventoryData, addProduct, updateProduct, deleteProduct } from '@/app/actions/inventory';
import { 
  Package, Plus, Trash2, Tag, ArrowUpDown, Box, Edit, X, Ruler,
  Search, Filter, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Save, Sparkles, Layers, Grid3x3, ChevronDown
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAddForm, setShowAddForm] = useState(false);

  // Initial Load
  const loadData = async () => {
    setLoading(true);
    const data = await getInventoryData();
    setProducts(data.products);
    setCategories(data.categories);
    setUnits(data.units);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? p.categoryId === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalItems = products.length;
  const lowStock = products.filter((p) => p.stockQty > 0 && p.stockQty <= 10).length;
  const outOfStock = products.filter((p) => p.stockQty <= 0).length;
  const onSale = products.filter((p) => p.isOnSale).length;
  const totalValuation = products.reduce((acc, p) => acc + (p.purchasePrice || p.costPrice || 0) * p.stockQty, 0);

  // Stock status helper
  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'rose', icon: <TrendingDown className="w-3 h-3" /> };
    if (qty <= 10) return { label: 'Low Stock', color: 'amber', icon: <AlertTriangle className="w-3 h-3" /> };
    return { label: 'In Stock', color: 'emerald', icon: <CheckCircle className="w-3 h-3" /> };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              Inventory & Stock Control
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your products, stock levels, and pricing
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/50 whitespace-nowrap"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Close Form' : 'Add New Product'}
          </button>
        </div>
      </div>

      {/* Stats Cards - Light Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Products', value: totalItems, icon: Box, color: 'indigo' },
          { label: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'amber' },
          { label: 'Out of Stock', value: outOfStock, icon: TrendingDown, color: 'rose' },
          { label: 'On Sale', value: onSale, icon: Tag, color: 'emerald' },
          { label: 'Total Value', value: `Rs. ${totalValuation.toLocaleString()}`, icon: TrendingUp, color: 'purple' },
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

      {/* Add Product Form - Light Theme */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> 
              Add New Inventory Item
            </h2>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Fill all required fields *</span>
          </div>
          <form
            action={async (formData) => {
              await addProduct(formData);
              await loadData();
              setShowAddForm(false);
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Gul Ahmed Premium Lawn"
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Barcode / Code</label>
              <input
                type="text"
                name="barcode"
                placeholder="e.g. 890123456"
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category <span className="text-rose-500">*</span></label>
              <select
                name="categoryId"
                required
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit <span className="text-rose-500">*</span></label>
              <select
                name="unitId"
                required
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              >
                <option value="">-- Select Unit --</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Price <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                required
                placeholder="1200"
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sale Price <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="0.01"
                name="salePrice"
                required
                placeholder="1800"
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stock Qty <span className="text-rose-500">*</span></label>
              <input
                type="number"
                step="0.1"
                name="stockQty"
                required
                placeholder="50"
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="isOnSale"
                  value="true"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                />
                <Tag className="w-4 h-4 text-rose-500" />
                Mark as Sale
              </label>
            </div>

            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200/50 transition-all"
              >
                <Save className="w-4 h-4" />
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search, Filter & View Controls - Light Theme */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[160px]">
            <Filter className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-8 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="p-3 bg-white border border-slate-200/60 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            title={viewMode === 'table' ? 'Grid View' : 'Table View'}
          >
            {viewMode === 'table' ? <Grid3x3 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-sm text-slate-500 font-medium">Loading inventory...</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW - Light Theme */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Unit</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Cost Price</th>
                  <th className="px-6 py-4 font-semibold">Sale Price</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No products found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const status = getStockStatus(p.stockQty);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{p.name}</p>
                            {p.code && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{p.code}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                            {p.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs hidden lg:table-cell">
                          {p.unit?.shortCode || 'm'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs hidden lg:table-cell">
                          Rs. {p.purchasePrice || p.costPrice || 0}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                          Rs. {p.salePrice}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-200`}>
                            {status.icon}
                            {p.stockQty} {p.unit?.shortCode || 'm'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          {p.isOnSale ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] px-2.5 py-1 rounded-full font-semibold border border-rose-200">
                              <Tag className="w-3 h-3" /> SALE
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${p.name}"?`)) {
                                  await deleteProduct(p.id);
                                  await loadData();
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-slate-200/60 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
          </div>
        </div>
      ) : (
        /* GRID VIEW - Light Theme */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const status = getStockStatus(p.stockQty);
            return (
              <div key={p.id} className="group bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                      {p.code && <p className="text-[10px] text-slate-400 font-mono">#{p.code}</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="text-slate-700 font-medium">{p.category?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit</span>
                    <span className="text-slate-700 font-mono">{p.unit?.shortCode || 'm'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sale Price</span>
                    <span className="font-bold text-indigo-600">Rs. {p.salePrice}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Stock</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-200`}>
                      {status.icon} {p.stockQty} {p.unit?.shortCode || 'm'}
                    </span>
                  </div>
                  {p.isOnSale && (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
                        <Tag className="w-3 h-3" /> ON SALE
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${p.name}"?`)) {
                        await deleteProduct(p.id);
                        await loadData();
                      }
                    }}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL - Light Theme */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Edit className="w-4 h-4 text-indigo-600" />
                  </div>
                  Edit Product
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update product details and pricing</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateProduct(formData);
                setEditingProduct(null);
                await loadData();
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingProduct.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Barcode / Code
                </label>
                <input
                  type="text"
                  name="barcode"
                  defaultValue={editingProduct.barcode || editingProduct.code || ''}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={editingProduct.categoryId}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Unit
                  </label>
                  <select
                    name="unitId"
                    defaultValue={editingProduct.unitId}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    {units.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    defaultValue={editingProduct.purchasePrice || editingProduct.costPrice || 0}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Sale Price <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    defaultValue={editingProduct.salePrice}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Stock Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="stockQty"
                    defaultValue={editingProduct.stockQty}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 p-3 bg-rose-50/50 rounded-xl border border-rose-200/60">
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isOnSale"
                    value="true"
                    defaultChecked={editingProduct.isOnSale}
                    className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-2 focus:ring-rose-200"
                  />
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span>Mark as Sale Item</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 hover:shadow-indigo-300/50"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
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