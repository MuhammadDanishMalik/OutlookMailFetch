'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Key,
  Mail,
  ShieldCheck,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Account } from '@/types';

interface AccountVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onRefreshAccounts: () => Promise<void>;
  onSelectAccount: (email: string) => void;
}

export const AccountVaultModal: React.FC<AccountVaultModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onRefreshAccounts,
  onSelectAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'bulk' | 'single' | 'export'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Single add state
  const [singleEmail, setSingleEmail] = useState('');
  const [singlePassword, setSinglePassword] = useState('');
  const [singleLabel, setSingleLabel] = useState('');
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Testing status
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase();
    return acc.email.toLowerCase().includes(q) || (acc.label && acc.label.toLowerCase().includes(q));
  });

  const recognizedCount = bulkText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('@') && (l.includes(':') || l.includes(',') || l.includes('|'))).length;

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', raw: bulkText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(`Success: ${data.message}`);
        setBulkText('');
        await onRefreshAccounts();
      } else {
        setImportResult(`Error: ${data.error || 'Failed to import'}`);
      }
    } catch (err: any) {
      setImportResult(`Error: ${err.message || 'Import failed'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim() || !singlePassword.trim()) return;
    setIsSavingSingle(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          account: {
            email: singleEmail.trim(),
            password: singlePassword.trim(),
            label: singleLabel.trim() || undefined,
            provider: 'outlook',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSingleEmail('');
        setSinglePassword('');
        setSingleLabel('');
        await onRefreshAccounts();
        setActiveTab('list');
      } else {
        alert(data.error || 'Failed to save account');
      }
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setIsSavingSingle(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return;
    try {
      const res = await fetch(`/api/accounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await onRefreshAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestAccount = async (acc: Account) => {
    setTestingId(acc.id);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: acc.email,
          password: acc.password,
        }),
      });
      const data = await res.json();
      await onRefreshAccounts();
      if (!data.success) {
        alert(`Connection Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Test error: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleBatchTest = async () => {
    if (accounts.length === 0) return;
    setIsBatchTesting(true);

    for (const acc of accounts) {
      try {
        setTestingId(acc.id);
        await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: acc.email, password: acc.password }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    setTestingId(null);
    setIsBatchTesting(false);
    await onRefreshAccounts();
  };

  const handleExportCopy = () => {
    const text = accounts.map((a) => `${a.email}:${a.password}${a.label ? `:${a.label}` : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleExportDownload = () => {
    const text = accounts.map((a) => `${a.email}:${a.password}${a.label ? `:${a.label}` : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `outlook_accounts_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">
                Multi-Account Vault Manager
              </h2>
              <p className="text-xs text-slate-400">
                {accounts.length} total Outlook / email accounts securely saved locally
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-black/30">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Saved Accounts ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Import</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'single'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Single</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export / Backup</span>
            </button>
          </div>

          {activeTab === 'list' && accounts.length > 0 && (
            <button
              type="button"
              onClick={handleBatchTest}
              disabled={isBatchTesting}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isBatchTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  <span>Testing All...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Test All IMAP</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] bg-black/40">
          {/* TAB 1: ACCOUNTS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {accounts.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accounts by email or label..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {filteredAccounts.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Mail className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-300 font-medium">
                    {searchQuery ? 'No accounts match your search.' : 'No accounts in the vault yet.'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Use <strong>Bulk Import</strong> to paste accounts in <code>email:password</code> format or <strong>Add Single</strong>.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('bulk')}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Bulk Import Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="glass-card p-3.5 rounded-xl flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            acc.status === 'healthy'
                              ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                              : acc.status === 'error'
                              ? 'bg-rose-400 ring-4 ring-rose-400/20'
                              : 'bg-gray-500'
                          }`}
                          title={
                            acc.status === 'healthy'
                              ? 'IMAP Connection Healthy'
                              : acc.status === 'error'
                              ? `Error: ${acc.lastError || 'Auth failed'}`
                              : 'Untested'
                          }
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-gray-100 truncate">
                              {acc.email}
                            </span>
                            {acc.label && (
                              <span className="px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/30">
                                {acc.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>Password: ••••••••</span>
                            {acc.lastCheckedAt && (
                              <span>
                                Checked: {new Date(acc.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAccount(acc.email);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                        >
                          Fetch Mails
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTestAccount(acc)}
                          disabled={testingId === acc.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Test IMAP credentials"
                        >
                          {testingId === acc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(acc.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BULK IMPORT */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 space-y-1">
                <p className="font-semibold">Bulk Import Instructions:</p>
                <p className="text-gray-300">
                  Paste your accounts line-by-line: <code>email:password</code> or <code>email:password:label</code> or CSV.
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Example:<br />
                  user1@outlook.com:password123<br />
                  user2@hotmail.com:mypassword:Netflix Main
                </p>
              </div>

              <div>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`user1@outlook.com:password123\nuser2@hotmail.com:mypassword:Label\n...`}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs font-mono text-gray-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400 font-mono">
                  {recognizedCount} valid account(s) recognized
                </span>

                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={isImporting || recognizedCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import {recognizedCount > 0 ? `${recognizedCount} Accounts` : ''}</span>
                    </>
                  )}
                </button>
              </div>

              {importResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    importResult.startsWith('Success')
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {importResult}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SINGLE ADD */}
          {activeTab === 'single' && (
            <form onSubmit={handleSaveSingle} className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">
                  Outlook / Hotmail / Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="user@outlook.com"
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-gray-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">
                  Password / App Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={singlePassword}
                    onChange={(e) => setSinglePassword(e.target.value)}
                    placeholder="Account Password or App Password"
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-gray-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">
                  Optional Label / Tag
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={singleLabel}
                    onChange={(e) => setSingleLabel(e.target.value)}
                    placeholder="e.g. Netflix 1, Personal, Gaming"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSingle || !singleEmail || !singlePassword}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isSavingSingle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Vault...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Vault</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: EXPORT / BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-gray-200">
                  Export Saved Credentials ({accounts.length} Accounts)
                </h4>
                <p className="text-xs text-slate-400">
                  Export all your saved accounts in standard <code>email:password</code> combo format.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                  >
                    {copiedExport ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All (Combo Format)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportDownload}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt File</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Vault data stored locally in <code>data/accounts.json</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
