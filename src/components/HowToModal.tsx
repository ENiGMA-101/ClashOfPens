import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { Sound } from '../game/audio';

interface HowToModalProps {
  onClose: () => void;
}

export const HowToModal: React.FC<HowToModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#1a110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                How to Play <span className="font-bangla text-lg text-[#d8536b] font-normal">(নিয়মাবলী)</span>
              </h2>
              <p className="text-xs text-gray-400">Master the classic classroom desk brawl</p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close how to play modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules notebook content */}
        <div className="space-y-4 text-xs leading-relaxed text-gray-300">
          <div className="p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <h3 className="font-kalam font-bold text-base text-[#f5d061] mb-1">
              Core Objective (মুল উদ্দেশ্য)
            </h3>
            <p>
              Every player gets one pen placed on the wooden desk. Take turns flicking your pen
              into the opponents. Any pen that slides over the edge of the desk is eliminated. The
              last remaining pen on the desk wins the match!
            </p>
          </div>

          <div className="p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <h3 className="font-kalam font-bold text-base text-[#f5d061] mb-2">
              The 3 Attack Sides (তিনটি আঘাত শৈলী)
            </h3>
            <div className="space-y-2">
              <div>
                <b className="text-white">1. Side 1: Top Strike (শীর্ষ আঘাত):</b>
                <p className="text-gray-400">
                  Strikes the nib/tip of the pen. Produces heavy rotational spin as it slides.
                  Sweeps in a wide curve, ideal for clipping pens hiding around obstacles.
                </p>
              </div>
              <div>
                <b className="text-white">2. Side 2: Middle Push (সরাসরি ধাক্কা):</b>
                <p className="text-gray-400">
                  Dead-center impact with zero spin. On a direct collision, stops dead in its
                  tracks and transfers nearly all momentum into the target. The deadliest knockout
                  shot!
                </p>
              </div>
              <div>
                <b className="text-white">3. Side 3: Bottom Slam (ভারী আঘাত):</b>
                <p className="text-gray-400">
                  Strikes the cap end. The pen becomes a heavy battering ram with high mass. Longest
                  slide distance, but beware rolling off the edge with your victim!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <h3 className="font-kalam font-bold text-base text-[#f5d061] mb-1">
              Aiming & Touch Controls (নিয়ন্ত্রণ)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Drag anywhere on the desk to rotate your aim vector.</li>
              <li>Adjust the Power Slider (1% to 100%) to calibrate flick distance.</li>
              <li>The dotted trajectory guide shows the projected slide path and collision point.</li>
              <li>Tap the <span className="text-[#f5c518] font-bold">FLICK!</span> button to unleash your shot.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
