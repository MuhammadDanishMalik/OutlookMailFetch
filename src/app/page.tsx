'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { PortalSections } from '@/components/PortalSections';
import { OtpHeroCard } from '@/components/OtpHeroCard';
import { EmailList } from '@/components/EmailList';
import { EmailDetailModal } from '@/components/EmailDetailModal';
import { AccountVaultModal } from '@/components/AccountVaultModal';
import { OutlookGuideModal } from '@/components/OutlookGuideModal';
import { LivePollingBar } from '@/components/LivePollingBar';
import { Account, EmailMessage, FetchEmailsResponse } from '@/types';
import {
  Mail,
  Zap,
  Key,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Database,
  Tv,
  Shield,
} from 'lucide-react';

export default function HomePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [household, setHousehold] = useState<FetchEmailsResponse['household']>([]);
  const [verification, setVerification] = useState<FetchEmailsResponse['verification']>([]);
  const [latestOtp, setLatestOtp] = useState<FetchEmailsResponse['latestOtp'] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);

  // Modals state
  const [selectedEmailDetail, setSelectedEmailDetail] = useState<EmailMessage | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Live polling mode
  const [isPolling, setIsPolling] = useState(false);
  const [oauthNotConfigured, setOauthNotConfigured] = useState(false);

  // Load saved accounts from local storage API
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
    // Handle OAuth redirect results
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const oauthError = params.get('oauth_error');
    if (oauthSuccess) {
      window.history.replaceState({}, '', '/');
      refreshAccounts();
      // Auto-fetch emails for the newly connected account
      setTimeout(() => handleFetchEmails(oauthSuccess), 500);
    }
    if (oauthError) {
      window.history.replaceState({}, '', '/');
      setFetchError(`Microsoft Sign-In failed: ${oauthError}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Fetch emails for an address
  const handleFetchEmails = useCallback(
    async (email: string, password?: string, saveToVault?: boolean) => {
      if (!email) return;

      setIsLoading(true);
      setFetchError(null);
      setCurrentEmail(email);

      try {
        if (password && saveToVault) {
          try {
            await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save',
                account: { email, password, provider: 'outlook' },
              }),
            });
            await refreshAccounts();
          } catch (e) {
            console.error('Failed to auto-save account:', e);
          }
        }

        const res = await fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, limit: 20 }),
        });

        const data: FetchEmailsResponse = await res.json();

        if (data.success) {
          setEmails(data.emails);
          setHousehold(data.household || []);
          setVerification(data.verification || []);
          setLatestOtp(data.latestOtp || null);
          setTimeTakenMs(data.timeTakenMs);
          setFetchError(null);
        } else {
          setFetchError(data.error || 'Failed to fetch emails');
          setEmails([]);
          setHousehold([]);
          setVerification([]);
          setLatestOtp(null);
        }
      } catch (err: any) {
        setFetchError(err?.message || 'Network error occurred while connecting to IMAP server');
        setEmails([]);
        setHousehold([]);
        setVerification([]);
        setLatestOtp(null);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAccounts]
  );

  // Trigger demo preview
  const handleTriggerDemo = async () => {
    setIsLoadingDemo(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/demo-emails');
      const data: FetchEmailsResponse = await res.json();
      if (data.success) {
        setCurrentEmail('user-demo@outlook.com');
        setEmails(data.emails);
        setHousehold(data.household || []);
        setVerification(data.verification || []);
        setLatestOtp(data.latestOtp || null);
        setTimeTakenMs(data.timeTakenMs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleOpenEmailById = (id: string) => {
    const found = emails.find((e) => e.id === id);
    if (found) {
      setSelectedEmailDetail(found);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient background glow */}
      <div className="ambient-glow absolute top-0 left-0 right-0 h-[500px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar
        accountsCount={accounts.length}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onTriggerDemo={handleTriggerDemo}
        isLoadingDemo={isLoadingDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold shadow-inner">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>Outlook &bull; Hotmail &bull; Netflix Household &bull; Verification Code Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-300 to-red-400">
            Netflix Verification &amp; Security Code Lookup
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Search any Outlook, Hotmail, or email account to instantly retrieve Netflix Household update links, temporary codes, and 2FA verification tokens.
          </p>
        </div>

        {/* Hero Search Bar */}
        <SearchBar
          accounts={accounts}
          currentEmail={currentEmail}
          onSearch={handleFetchEmails}
          isLoading={isLoading}
        />

        {/* Error Alert Box */}
        {fetchError && (
          <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 shadow-xl animate-in fade-in space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-rose-100 text-sm">Connection or Authentication Notice</p>
                  <p className="text-rose-300/90 leading-relaxed">{fetchError}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href="https://account.microsoft.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 transition-colors cursor-pointer"
                >
                  Microsoft Security &rarr;
                </a>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 transition-colors cursor-pointer"
                >
                  Outlook Guide
                </button>
              </div>
            </div>

            {/* Sign in with Microsoft OAuth — primary fix for Basic Auth disabled */}
            <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 text-xs text-rose-200/80">
                <span className="font-semibold text-white">Microsoft now requires OAuth login</span> — click the button to authorize access securely. No password needed.
              </div>
              <a
                href="/api/auth/microsoft"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#0078d4] hover:bg-[#006cbe] text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0 no-underline"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Sign in with Microsoft
              </a>
            </div>

            {/* Quick App Password Fix / Retry for Current Email */}
            {currentEmail && (
              <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex items-center gap-2 text-xs text-rose-300 font-medium shrink-0">
                  <Key className="w-4 h-4 text-rose-400" />
                  <span>Or try App Password for <code className="font-mono text-white">{currentEmail}</code>:</span>
                </div>
                <input
                  type="password"
                  placeholder="Enter 16-character App Password..."
                  id="retry-app-password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) handleFetchEmails(currentEmail, val, true);
                    }
                  }}
                  className="flex-1 bg-black/60 border border-rose-500/30 rounded-xl px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-rose-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('retry-app-password') as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleFetchEmails(currentEmail, el.value.trim(), true);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30 cursor-pointer shrink-0"
                >
                  Save &amp; Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Content Area (When search active) */}
        {currentEmail && (emails.length > 0 || latestOtp || household.length > 0 || verification.length > 0) && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Prominent OTP Hero Card if code found */}
            {latestOtp && (
              <OtpHeroCard
                otpData={latestOtp}
                emailAddress={currentEmail}
                onViewEmail={handleOpenEmailById}
              />
            )}

            {/* dg-subs style Dual Portal Sections: Household vs Verification */}
            <PortalSections
              household={household}
              verification={verification}
              onOpenEmail={handleOpenEmailById}
            />

            {/* Live Polling / Auto-Refresh Bar */}
            <LivePollingBar
              isPolling={isPolling}
              onTogglePolling={setIsPolling}
              onManualRefresh={() => handleFetchEmails(currentEmail)}
              intervalSeconds={10}
              isLoading={isLoading}
            />

            {/* Full Email Messages Feed */}
            <EmailList
              emails={emails}
              currentEmail={currentEmail}
              onSelectEmail={(item) => setSelectedEmailDetail(item)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Welcome Cards (When no search yet) */}
        {!currentEmail && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {/* Card 1: Live Demo */}
            <div
              onClick={handleTriggerDemo}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-gray-100 group-hover:text-rose-300 transition-colors">
                1. Test Live Demo
              </h2>
              <p className="text-xs text-slate-400">
                Preview how Netflix Household update links and verification codes are automatically parsed and displayed.
              </p>
              <div className="text-xs font-semibold text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Launch Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Bulk Import */}
            <div
              onClick={() => setIsVaultOpen(true)}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-pink-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-gray-100 group-hover:text-pink-300 transition-colors">
                2. Bulk Import Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Paste hundreds of Outlook / Hotmail accounts in <code>email:password</code> format into the local vault.
              </p>
              <div className="text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Setup Guide */}
            <div
              onClick={() => setIsGuideOpen(true)}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-red-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-gray-100 group-hover:text-red-300 transition-colors">
                3. Outlook IMAP Guide
              </h2>
              <p className="text-xs text-slate-400">
                Learn how Outlook and Microsoft accounts connect via IMAP for automated code and Netflix link fetching.
              </p>
              <div className="text-xs font-semibold text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Setup Steps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Outlook Code Portal &bull; Netflix Household &amp; Verification Hub &bull; Direct IMAP
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              Outlook Guide
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsVaultOpen(true)}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              Account Vault ({accounts.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmailDetailModal
        email={selectedEmailDetail}
        onClose={() => setSelectedEmailDetail(null)}
      />

      <AccountVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        accounts={accounts}
        onRefreshAccounts={refreshAccounts}
        onSelectAccount={(email) => {
          setCurrentEmail(email);
          handleFetchEmails(email);
        }}
      />

      <OutlookGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
