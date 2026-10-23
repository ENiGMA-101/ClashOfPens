import React, { useState } from 'react';
import { X, Smartphone, Check, Copy, ShieldCheck, Terminal, Award, FileText } from 'lucide-react';
import { Sound } from '../game/audio';

interface AndroidReleaseModalProps {
  onClose: () => void;
}

export const AndroidReleaseModal: React.FC<AndroidReleaseModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    Sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const keystoreCommand = `keytool -genkey -v -keystore penfight-release-key.jks -alias penfight -keyalg RSA -keysize 2048 -validity 10000`;
  const gradlewBuildCommand = `./gradlew bundleRelease`;
  const debugApkCommand = `./gradlew assembleDebug`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#160f09] border-2 border-[#22c55e]/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-[#f3f4f6] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#10422a] border border-[#22c55e]/40 rounded-xl text-[#a3e635]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#a3e635] leading-none">
                Google Play Store Release Package
              </h2>
              <p className="text-xs text-gray-400">
                Targeting Android 16 / API Level 36 &middot; Offline-First Native Capacitor Architecture
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close android release modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
          <div className="p-2.5 bg-[#20140b] rounded-xl border border-[#3d2414]">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">App ID</span>
            <span className="font-mono font-bold text-amber-300 text-[11px] truncate block">
              com.penfight.deskbrawl
            </span>
          </div>
          <div className="p-2.5 bg-[#20140b] rounded-xl border border-[#3d2414]">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Target SDK</span>
            <span className="font-bold text-emerald-400 text-xs">API 36 (Android 16)</span>
          </div>
          <div className="p-2.5 bg-[#20140b] rounded-xl border border-[#3d2414]">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Version</span>
            <span className="font-bold text-purple-300 text-xs">1.0.0 (Code: 1)</span>
          </div>
          <div className="p-2.5 bg-[#20140b] rounded-xl border border-[#3d2414]">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Offline Storage</span>
            <span className="font-bold text-blue-300 text-xs">Zero Permissions</span>
          </div>
        </div>

        {/* Step-by-Step Release Instructions */}
        <div className="space-y-4 text-xs leading-relaxed">
          {/* Step 1: Capacitor Native Sync */}
          <div className="p-4 bg-[#1f140c] rounded-2xl border border-[#422917]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <Terminal className="w-4 h-4" />
                <span>1. Build Web Assets & Sync Native Capacitor</span>
              </span>
              <button
                onClick={() => copyToClipboard('npm run build && npx cap sync android', 'cap_sync')}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 bg-[#2e1c10] px-2 py-1 rounded"
              >
                {copiedSection === 'cap_sync' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="bg-[#120a05] p-2.5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto border border-white/5">
              npm run build{'\n'}npx cap add android{'\n'}npx cap sync android
            </pre>
            <p className="text-gray-400 mt-2">
              All HTML5 Canvas, Matter.js physics, sounds, and pen assets are packaged directly into the local Android asset bundle. Zero external CDN calls needed.
            </p>
          </div>

          {/* Step 2: Keystore & Signing */}
          <div className="p-4 bg-[#1f140c] rounded-2xl border border-[#422917]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Create Release Signing Key (Do Not Commit to Git)</span>
              </span>
              <button
                onClick={() => copyToClipboard(keystoreCommand, 'keystore')}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 bg-[#2e1c10] px-2 py-1 rounded"
              >
                {copiedSection === 'keystore' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="bg-[#120a05] p-2.5 rounded-xl font-mono text-[11px] text-amber-300 overflow-x-auto border border-white/5">
              {keystoreCommand}
            </pre>
            <p className="text-gray-400 mt-2">
              Store <code className="text-amber-200">penfight-release-key.jks</code> in a secure private location. Add it to your local <code className="text-amber-200">~/.gradle/gradle.properties</code> or configure Google Play App Signing.
            </p>
          </div>

          {/* Step 3: Generate AAB & APK */}
          <div className="p-4 bg-[#1f140c] rounded-2xl border border-[#422917]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4" />
                <span>3. Build Android App Bundle (.aab) & Debug APK</span>
              </span>
              <button
                onClick={() => copyToClipboard(`cd android && ${gradlewBuildCommand}`, 'aab')}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 bg-[#2e1c10] px-2 py-1 rounded"
              >
                {copiedSection === 'aab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="bg-[#120a05] p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto border border-white/5">
              cd android{'\n'}# Build release bundle for Google Play Console:{'\n'}{gradlewBuildCommand}{'\n\n'}# Build debug APK for testing on physical phone:{'\n'}{debugApkCommand}
            </pre>
          </div>

          {/* Step 4: Closed Testing Requirement Guidance */}
          <div className="p-4 bg-amber-950/20 rounded-2xl border border-amber-500/30">
            <h4 className="font-bold text-amber-400 text-sm mb-1">
              Google Play Closed-Testing Requirement (Post-Nov 2023 Accounts)
            </h4>
            <p className="text-gray-300">
              Personal developer accounts created after November 13, 2023 require at least <b>12 testers</b> to be opted into a Closed Test track continuously for <b>at least 14 days</b> before applying for production access. Recruit classmates, friends, or desk brawl enthusiasts to test your debug APK or internal test track during this period.
            </p>
          </div>

          {/* Step 5: Store Listing Copy */}
          <div className="p-4 bg-[#1f140c] rounded-2xl border border-[#422917]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <FileText className="w-4 h-4" />
                <span>Google Play Store Listing Copy</span>
              </span>
            </div>
            <div className="space-y-2 text-gray-300">
              <div>
                <b className="text-white">Short Description (under 80 chars):</b>
                <p className="italic text-amber-200 bg-[#120a05] p-2 rounded-lg mt-0.5 font-mono text-[11px]">
                  Flick your pen, knock rivals off the wooden desk, and claim the championship!
                </p>
              </div>
              <div>
                <b className="text-white">Bangla Title & Tagline:</b>
                <p className="italic text-amber-200 bg-[#120a05] p-2 rounded-lg mt-0.5 font-mono text-[11px]">
                  কলম যুদ্ধ (Pen Fight: Desk Brawl) &middot; ব্যাকবেঞ্চের নস্টালজিক খেলা
                </p>
              </div>
              <div>
                <b className="text-white">Content Rating & Privacy:</b>
                <p className="text-gray-400 mt-0.5">
                  Violence: None / Comedic cartoon physics. Data collected: Zero (100% offline gameplay, no tracking, no account registration required).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
