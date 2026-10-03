'use client';

import { useState } from 'react';
import { addUser, updateUser, deleteUser } from '@/app/actions/users';
import { 
  UserPlus, Shield, Users, Trash2, Key, Edit, X, Check, Lock, 
  Sparkles, UserCog, Building2, Mail, Phone, Calendar
} from 'lucide-react';

const SYSTEM_PAGES = [
  { route: '/', label: 'Dashboard / Home' },
  { route: '/pos', label: 'POS Billing' },
  { route: '/inventory', label: 'Inventory & Stock' },
  { route: '/categories', label: 'Categories & Units' },
  { route: '/installments', label: 'Installments (Khata)' },
  { route: '/sales', label: 'Sales & Returns' },
  { route: '/users', label: 'User Management' },
  { route: '/settings', label: 'Store Settings' }
];

const roleColors = {
  SUPER_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  MANAGER: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  SALESMAN: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

const roleIcons = {
  SUPER_ADMIN: <Shield className="w-4 h-4" />,
  MANAGER: <UserCog className="w-4 h-4" />,
  SALESMAN: <UserPlus className="w-4 h-4" />,
};

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALESMAN');

  // Permission Object State
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    const initialPerms: Record<string, boolean> = {};
    SYSTEM_PAGES.forEach((p) => {
      initialPerms[p.route] = true;
    });
    return initialPerms;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('SALESMAN');
    const defaultPerms: Record<string, boolean> = {};
    SYSTEM_PAGES.forEach((p) => {
      defaultPerms[p.route] = true;
    });
    setPermissions(defaultPerms);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);

    const permMap: Record<string, boolean> = {};
    SYSTEM_PAGES.forEach((p) => {
      const found = user.permissions.find((perm: any) => perm.pageRoute === p.route);
      // Fixed: Default to false if not explicitly granted in DB
      permMap[p.route] = found ? found.canAccess : false;
    });
    setPermissions(permMap);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (route: string) => {
    setPermissions((prev) => ({ ...prev, [route]: !prev[route] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedPermissions = Object.entries(permissions).map(([pageRoute, canAccess]) => ({
      pageRoute,
      canAccess: role === 'SUPER_ADMIN' ? true : canAccess,
    }));

    if (editingUser) {
      await updateUser(editingUser.id, {
        name,
        username,
        password: password || undefined,
        role,
        permissions: formattedPermissions,
      });
    } else {
      await addUser({
        name,
        username,
        password,
        role,
        permissions: formattedPermissions,
      });
    }

    setIsModalOpen(false);
  };

  const totalUsers = initialUsers.length;
  const adminCount = initialUsers.filter(u => u.role === 'SUPER_ADMIN').length;
  const managerCount = initialUsers.filter(u => u.role === 'MANAGER').length;
  const salesmanCount = initialUsers.filter(u => u.role === 'SALESMAN').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50">
                <Users className="w-5 h-5 text-white" />
              </div>
              User & Security Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              System accounts, user roles, and page permissions management
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/50"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'indigo' },
          { label: 'Super Admins', value: adminCount, icon: Shield, color: 'purple' },
          { label: 'Managers', value: managerCount, icon: UserCog, color: 'blue' },
          { label: 'Salesmen', value: salesmanCount, icon: UserPlus, color: 'emerald' },
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

      {/* User Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialUsers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600">No users yet</p>
            <p className="text-sm text-slate-400">Click "Add New User" to create your first account</p>
          </div>
        ) : (
          initialUsers.map((user) => {
            const roleStyle = roleColors[user.role as keyof typeof roleColors] || roleColors.SALESMAN;
            const roleIcon = roleIcons[user.role as keyof typeof roleIcons] || roleIcons.SALESMAN;

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col space-y-4 transition-all hover:shadow-lg hover:border-indigo-200/50 hover:-translate-y-1 duration-300"
              >
                <div className="flex items-start justify-between">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${roleStyle.bg} ${roleStyle.text} flex items-center justify-center font-bold text-lg border ${roleStyle.border}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{user.name}</h3>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Key className="w-3 h-3 text-slate-400" /> @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${roleStyle.badge}`}>
                    {roleIcon} {user.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <form action={deleteUser.bind(null, user.id)} className="flex-1">
                    <button
                      type="submit"
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </form>
                </div>

                {/* Page Access Preview */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] text-slate-400 mb-2 font-medium uppercase tracking-wider">Page Access</p>
                  <div className="flex flex-wrap gap-1">
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Full System Access
                      </span>
                    ) : (
                      user.permissions
                        .filter((perm: any) => perm.canAccess)
                        .map((perm: any) => {
                          const p = SYSTEM_PAGES.find((page) => page.route === perm.pageRoute);
                          if (!p) return null;
                          return (
                            <span
                              key={p.route}
                              className="text-[9px] px-2 py-0.5 rounded-full font-mono border bg-emerald-50 text-emerald-600 border-emerald-200"
                            >
                              {p.label}
                            </span>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ====== CREATE / EDIT MODAL ====== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-200/60">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-200/50">
                    {editingUser ? <Edit className="w-4 h-4 text-white" /> : <UserPlus className="w-4 h-4 text-white" />}
                  </div>
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New System Account'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingUser ? 'Update user details and permissions' : 'Add a new user to the system'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ali_pos"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Password {editingUser && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
                    {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Account Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    <option value="SALESMAN">Salesman</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* PAGE PERMISSIONS */}
              <div className="border-t border-slate-200/60 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    Page Permissions
                  </label>
                  {role === 'SUPER_ADMIN' && (
                    <span className="text-[10px] text-purple-600 flex items-center gap-1 font-mono bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      <Lock className="w-3 h-3" /> Full System Access
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SYSTEM_PAGES.map((page) => {
                    const isChecked = role === 'SUPER_ADMIN' || permissions[page.route];

                    return (
                      <div
                        key={page.route}
                        onClick={() => role !== 'SUPER_ADMIN' && handleTogglePermission(page.route)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-200 text-slate-700'
                            : 'bg-slate-50 border-slate-200/60 text-slate-400 hover:border-slate-300'
                        } ${role === 'SUPER_ADMIN' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                      >
                        <span className="font-medium">{page.label}</span>
                        <div
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex-shrink-0 ${
                            isChecked ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 hover:shadow-indigo-300/50"
                >
                  <Sparkles className="w-4 h-4" />
                  {editingUser ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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