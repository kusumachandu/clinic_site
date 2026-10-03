'use client';
import { useState } from 'react';
import PickButton from './PickButton';

const OPTIONS = [
  ['😖', 'I have a toothache', /emerg|pain|urgent/i, 'Do not wait. We hold same-day slots for pain, swelling or a broken tooth.'],
  ['🟡', 'My teeth look yellow', /whiten|bleach/i, 'Professional whitening can lift several shades in one visit.'],
  ['↔️', 'My teeth are crooked', /align|brace|ortho/i, 'Clear aligners straighten teeth discreetly, with a 3D preview first.'],
  ['🕳️', 'I have a missing tooth', /implant/i, 'An implant replaces the tooth and root, and looks and feels natural.'],
  ['🧒', 'It is for my child', /kid|child|paed|pedi/i, 'Our paediatric dentist keeps visits short, calm and playful.'],
  ['🔍', 'Just a regular check-up', /check|clean/i, 'A check-up and cleaning twice a year prevents most problems.'],
];

export default function Finder({ services }) {
  const [i, setI] = useState(null);
  const pick = i === null ? null : OPTIONS[i];
  const match = pick && (services.find((s) => pick[2].test(s.name)) || services[0]);
  return (
    <div className="lm-tool">
      <p className="lm-q">What brings you in?</p>
      <div className="lm-opts">
        {OPTIONS.map((o, k) => <button type="button" key={o[1]} className={i === k ? 'on' : ''} aria-pressed={i === k} onClick={() => setI(k)}><span>{o[0]}</span>{o[1]}</button>)}
      </div>
      {pick && (
        <div className="lm-result" role="status">
          <b>{match ? `We suggest: ${match.name}` : 'We suggest a consultation'}</b>
          <p>{pick[3]}</p>
          <PickButton serviceId={match?._id} className="lm-btn">Book this →</PickButton>
        </div>
      )}
    </div>
  );
}
