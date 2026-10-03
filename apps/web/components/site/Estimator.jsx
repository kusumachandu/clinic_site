'use client';
import { useState } from 'react';
import PickButton from './PickButton';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Estimator({ services }) {
  const priced = services.filter((s) => Number(s.price) > 0);
  const [id, setId] = useState(priced[0]?._id || '');
  const [months, setMonths] = useState(6);
  const [ins, setIns] = useState(false);
  const s = priced.find((x) => x._id === id);
  if (!s) return <div className="lm-tool"><p className="lm-fine">Pricing will appear here once treatments are added.</p></div>;

  const pay = Number(s.price) * (ins ? 0.7 : 1);
  const rate = months > 6 ? 0.12 / 12 : 0;
  const emi = rate ? (pay * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1) : pay / months;
  return (
    <div className="lm-tool">
      <label className="lm-field">Treatment
        <select value={id} onChange={(e) => setId(e.target.value)}>{priced.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select>
      </label>
      <div className="lm-seg" role="group" aria-label="Instalment months">
        {[3, 6, 12].map((m) => <button type="button" key={m} className={months === m ? 'on' : ''} aria-pressed={months === m} onClick={() => setMonths(m)}>{m} months</button>)}
      </div>
      <label className="lm-check"><input type="checkbox" checked={ins} onChange={(e) => setIns(e.target.checked)} /> I have dental insurance (assumes about 30% cover)</label>
      <div className="lm-emi"><span>Estimated monthly</span><b>{inr(emi)}</b><small>{months > 6 ? '12% p.a. interest' : 'No-cost EMI'} · total {inr(emi * months)}</small></div>
      <PickButton serviceId={s._id} className="lm-btn">Book {s.name}</PickButton>
      <p className="lm-fine">Estimate only. Your written quote comes after the consultation.</p>
    </div>
  );
}
