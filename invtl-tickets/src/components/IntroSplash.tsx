'use client';

// Opening animation: INVTL builds in, a line draws, then the TorqTechnologies credit.
// Plays once per visit, never on passes or Pitlane. Tap to skip.
import { useEffect, useState } from 'react';
import './intro.css';

const LETTERS = ['I', 'N', 'V', 'T', 'L'];

export default function IntroSplash() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('no-intro')) setGone(true);
  }, []);

  function finish() {
    try {
      sessionStorage.setItem('invtl-intro-seen', '1');
    } catch {}
    setGone(true);
  }

  if (gone) return null;

  return (
    <div
      id="invtl-intro"
      className={leaving ? 'is-leaving' : ''}
      onClick={() => setLeaving(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
      aria-hidden
    >
      <div className="intro-word">
        {LETTERS.map((l, i) => (
          <span key={l} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
            {l}
          </span>
        ))}
      </div>
      <div className="intro-line" />
      <div className="intro-credit">
        <span>Created for INVTL by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/torq-technologies.png" alt="TorqTechnologies" />
      </div>
      <div className="intro-skip">Tap to skip</div>
    </div>
  );
}
