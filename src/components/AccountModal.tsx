import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Trash2,
  AlertCircle,
  Database,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PlayerProgress } from '../types/game';
import {
  checkSession,
  authenticateWithGoogle,
  logoutSession,
  syncProgressToCloud,
  deleteCloudAccount,
  UserSession,
  SyncStatus,
} from '../game/cloudSync';
import { Sound } from '../game/audio';

interface AccountModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onApplyCloudSave: (loadedProgress: PlayerProgress) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  progress,
  onClose,
  onApplyCloudSave,
}) => {
  const [session, setSession] = useState<UserSession>({
    authenticated: false,
    isDbConnected: false,
  });
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [demoName, setDemoName] = useState('');

  // Fetch session on open
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const sess = await checkSession();
      if (!isMounted) return;
      setSession(sess);
      if (sess.authenticated) {
        setSyncStatus('saved');
        setStatusMessage('Synchronized with Neon PostgreSQL');
      } else {
        setSyncStatus('offline');
        setStatusMessage('Offline mode — save is safe on this device');
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualSync = async () => {
    Sound.playClick();
    setSyncStatus('syncing');
    setStatusMessage('Syncing data to Neon database...');
    const result = await syncProgressToCloud(progress);
    if (result.success) {
      setSyncStatus('saved');
      setStatusMessage('Progress saved to cloud successfully!');
    } else if (result.conflict && result.cloudSave) {
      setSyncStatus('saved');
      setStatusMessage('Resolved conflict: Cloud save loaded.');
      if (result.cloudSave.xp !== undefined) {
        onApplyCloudSave({
          ...progress,
          xp: result.cloudSave.xp,
          level: result.cloudSave.level,
          coins: result.cloudSave.coins,
          unlockedSkins: result.cloudSave.unlockedPens || progress.unlockedSkins,
          equippedSkin: result.cloudSave.equippedSkin || progress.equippedSkin,
        });
      }
    } else {
      setSyncStatus('error');
      setStatusMessage(result.error || 'Failed to sync with cloud. Will retry.');
    }
  };

  const handleSimulatedGoogleSignIn = async (name: string) => {
    Sound.playClick();
    setSyncStatus('syncing');
    setStatusMessage('Authenticating...');
    const dummySub = 'google_' + Math.abs(name.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
    const result = await authenticateWithGoogle(undefined, {
      sub: dummySub,
      name: name.trim() || 'Champion Brawler',
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'pen')}`,
    });

    if (result.success) {
      setSession({
        authenticated: true,
        user: result.user,
        isDbConnected: true,
      });
      setSyncStatus('saved');
      setStatusMessage(`Welcome, ${result.user?.displayName}! Cloud save linked.`);
      if (result.save && result.save.xp > progress.xp) {
        onApplyCloudSave({
          ...progress,
          xp: result.save.xp,
          level: result.save.level,
          coins: result.save.coins,
          unlockedSkins: result.save.unlockedPens || progress.unlockedSkins,
          equippedSkin: result.save.equippedSkin || progress.equippedSkin,
        });
      } else {
        await syncProgressToCloud(progress);
      }
    } else {
      setSyncStatus('error');
      setStatusMessage(result.error || 'Sign in failed');
    }
  };

  const handleLogout = async () => {
    Sound.playClick();
    await logoutSession();
    setSession({ authenticated: false, isDbConnected: session.isDbConnected });
    setSyncStatus('offline');
    setStatusMessage('Logged out. Playing locally on this device.');
  };

  const handleDeleteAccount = async () => {
    Sound.playClick();
    const ok = await deleteCloudAccount();
    if (ok) {
      setShowDeleteConfirm(false);
      setSession({ authenticated: false, isDbConnected: session.isDbConnected });
      setSyncStatus('offline');
      setStatusMessage('Cloud account and records deleted successfully.');
    } else {
      setStatusMessage('Could not delete account. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      data-testid="account-modal"
    >
      <div className="w-full max-w-lg bg-[#18110b] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-stone-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3d2719] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-kalam font-bold text-2xl text-amber-100 leading-tight">
                Account & Cloud Save
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  Neon PostgreSQL
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-400">Google Auth</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close"
            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 text-sm ${
              syncStatus === 'saved'
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                : syncStatus === 'syncing'
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-200 animate-pulse'
                : syncStatus === 'error'
                ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                : 'bg-stone-800/60 border-stone-700/60 text-stone-300'
            }`}
          >
            {syncStatus === 'saved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
            ) : syncStatus === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">
              <div className="font-bold">
                {syncStatus === 'saved'
                  ? 'Cloud Save Synchronized'
                  : syncStatus === 'syncing'
                  ? 'Synchronizing...'
                  : syncStatus === 'error'
                  ? 'Sync Issue Encountered'
                  : 'Offline / Local Play'}
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {statusMessage ||
                  (session.authenticated
                    ? 'Your stats, coins, trophies, and unlocked pens are backed up to the cloud.'
                    : 'Your progress is stored securely in your browser localStorage.')}
              </p>
            </div>
          </div>

          {/* User Profile Card */}
          {session.authenticated && session.user ? (
            <div className="p-4 rounded-2xl bg-[#23170e] border border-amber-700/40 space-y-3">
              <div className="flex items-center gap-3">
                {session.user.avatarUrl ? (
                  <img
                    src={session.user.avatarUrl}
                    alt={session.user.displayName}
                    className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-600/30 border border-amber-500/60 flex items-center justify-center text-amber-300">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-lg text-amber-100">
                    {session.user.displayName}
                  </div>
                  <div className="text-xs text-stone-400 font-mono">
                    ID: {session.user.id.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800 text-center text-xs">
                <div className="bg-[#170e08] p-2 rounded-xl border border-stone-800">
                  <div className="text-stone-400 text-[10px] uppercase font-bold">Level</div>
                  <div className="text-amber-300 font-black text-base">{progress.level}</div>
                </div>
                <div className="bg-[#170e08] p-2 rounded-xl border border-stone-800">
                  <div className="text-stone-400 text-[10px] uppercase font-bold">Coins</div>
                  <div className="text-amber-300 font-black text-base">🪙 {progress.coins}</div>
                </div>
                <div className="bg-[#170e08] p-2 rounded-xl border border-stone-800">
                  <div className="text-stone-400 text-[10px] uppercase font-bold">Unlocked</div>
                  <div className="text-amber-300 font-black text-base">
                    {progress.unlockedSkins.length} Pens
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Box */
            <div className="p-4 rounded-2xl bg-[#23170e] border border-[#4a2e1b] space-y-3">
              <div className="text-sm font-semibold text-stone-200">
                Sign in with Google to enable cross-device Cloud Saves & Rankings:
              </div>

              {/* Fast Sign-In / Demo Connect */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Player handle (e.g. MasterFlicker)"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  maxLength={18}
                  className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-500 text-sm focus:border-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSimulatedGoogleSignIn(demoName || 'Desk Champion')}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Connect Google Account
                </button>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                Connects directly to your Neon PostgreSQL database instance. Saves persist across devices and browsers.
              </p>
            </div>
          )}

          {/* Account Deletion Area (if authenticated) */}
          {session.authenticated && (
            <div className="pt-2">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete account & cloud save...
                </button>
              ) : (
                <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-rose-200">
                    Permanently delete cloud save and match history?
                  </div>
                  <p className="text-stone-300 text-[11px]">
                    This removes your Neon PostgreSQL record. Local save on this device will remain until browser data is cleared.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                    >
                      Yes, Delete Cloud Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
