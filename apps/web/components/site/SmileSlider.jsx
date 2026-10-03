'use client';
import { useState } from 'react';

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const Teeth = ({ tone }) => (
  <svg viewBox="0 0 400 190" aria-hidden="true" className="lm-teeth">
    <rect width="400" height="190" fill="#e58f8f" />
    <path d="M24 70 Q200 -10 376 70 Q376 150 200 178 Q24 150 24 70Z" fill="#6b2433" />
    {Array.from({ length: 8 }, (_, i) => {
      const mid = Math.abs(i - 3.5), h = 62 - mid * 4.5, y = 62 + mid * mid * 2.4;
      return <rect key={i} x={52 + i * 37} y={y} width="34" height={h + 18} rx="14" fill={`rgb(${tone})`} stroke="rgba(0,0,0,.12)" />;
    })}
  </svg>
);

export default function SmileSlider() {
  const [pos, setPos] = useState(50);
  const [shades, setShades] = useState(6);
  const before = [214, 186, 128];
  const after = mix(before, [252, 253, 255], shades / 8);
  return (
    <div className="lm-tool">
      <div className="lm-compare" style={{ '--p': `${pos}%` }}>
        <Teeth tone={after} />
        <div className="lm-before"><Teeth tone={before} /></div>
        <span className="lm-tag a">Before</span><span className="lm-tag b">After</span>
        <i className="lm-handle" aria-hidden="true" />
        <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Drag to compare before and after" />
      </div>
      <label className="lm-range">Whitening level: <b>up to {shades} shades brighter</b>
        <input type="range" min="1" max="8" value={shades} onChange={(e) => setShades(Number(e.target.value))} />
      </label>
      <p className="lm-fine">Illustration only. Results vary by patient; we confirm what is realistic at your consultation.</p>
    </div>
  );
}
