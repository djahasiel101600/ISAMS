import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Building2, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Briefcase, 
  Sparkles,
  Layers,
  Shield
} from 'lucide-react';
import { User, Organization, RoleName } from '../../types/isams';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: User, org: Organization) => void;
  existingUsers: User[];
  organizations: Organization[];
  isSystemZeroState?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingUsers,
  organizations,
  isSystemZeroState = false
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(
    isSystemZeroState || existingUsers.length === 0 ? 'register' : 'login'
  );

  // Register Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleName>('Administrator');
  const [department, setDepartment] = useState('Operations');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizations[0]?.id || 'new');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [password, setPassword] = useState('');

  // Login Form State
  const [loginEmailOrId, setLoginEmailOrId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your full name and work email.');
      return;
    }

    if (selectedOrgId === 'new' && (!orgName.trim() || !orgCode.trim())) {
      setError('Please enter your Organization Name and Code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await api.registerUser({
        name,
        email,
        role,
        department,
        organization_id: selectedOrgId !== 'new' ? selectedOrgId : undefined,
        orgName: selectedOrgId === 'new' ? orgName : undefined,
        orgCode: selectedOrgId === 'new' ? orgCode : undefined
      });

      onSuccess(result.user, result.organization);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrId.trim()) {
      setError('Please enter your email address or account ID.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await api.loginUser(loginEmailOrId);
      onSuccess(result.user, result.organization);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Account not found. Please register or select an existing account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectUser = async (user: User) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.loginUser(user.id);
      onSuccess(result.user, result.organization);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const isZeroState = isSystemZeroState || existingUsers.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header Banner */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-blue-900/40 border-b border-slate-800">
          {onClose && !isZeroState && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  ISAMS Security & Auth
                </span>
                {isZeroState && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Zero State Unconfigured
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {isZeroState 
                  ? 'System Registration & Setup' 
                  : mode === 'register' ? 'Create User Account' : 'Sign In to ISAMS'}
              </h2>
            </div>
          </div>
        </div>

        {/* Auth Mode Toggle Bar (Only if users exist) */}
        {!isZeroState && (
          <div className="flex border-b border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-400" /> Sign In / Login
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" /> Register New Account
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              {error}
            </div>
          )}

          {/* ZERO STATE BANNER */}
          {isZeroState && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-xs leading-relaxed space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Initial Administrator & Organization Creation
              </div>
              <p className="text-amber-200/80">
                No active users or organizations were found in the database. Complete the form below to establish your primary organization and register as System Administrator.
              </p>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" /> Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Work Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operations, IT, Records"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> User Role
                  </label>
                  <select
                    value={role}
                    disabled={isZeroState}
                    onChange={(e) => setRole(e.target.value as RoleName)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans disabled:opacity-60 cursor-pointer"
                  >
                    <option value="Administrator">Administrator (Full Rights)</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Records Officer">Records Officer</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Staff">Staff Member</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
              </div>

              {/* Organization Assignment / Creation */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" /> Organization Assignment
                  </span>
                  {organizations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedOrgId(selectedOrgId === 'new' ? organizations[0].id : 'new')}
                      className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedOrgId === 'new' ? 'Join Existing Org' : '+ Create New Org'}
                    </button>
                  )}
                </label>

                {organizations.length > 0 && selectedOrgId !== 'new' ? (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans cursor-pointer"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Organization Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Global Logistics"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Organization Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AGL-HQ"
                        value={orgCode}
                        onChange={(e) => setOrgCode(e.target.value)}
                        className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Security PIN / Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Security PIN / Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter access PIN or password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {isZeroState ? 'Initialize Organization & Admin Account' : 'Register User Account'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && !isZeroState && (
            <div className="space-y-5">
              {/* Quick User Selection Cards */}
              {existingUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Select Existing User Account</span>
                    <span className="text-[11px] text-slate-500">1-Click Sign In</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {existingUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickSelectUser(u)}
                        disabled={loading}
                        className="flex items-center gap-2.5 p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-left transition-all cursor-pointer group"
                      >
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-600"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {u.role} &bull; {u.department || 'Staff'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> Account Email or User ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter email address or User ID..."
                    value={loginEmailOrId}
                    onChange={(e) => setLoginEmailOrId(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" /> Password / PIN
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" /> Sign In to Dashboard
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
