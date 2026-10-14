import { useState } from 'react';
import './DashboardCard.css';
import { Icon } from '../ui/primitives';
import { MiniPreview } from './MiniPreview';
import { DashboardMenu } from './DashboardMenu';
import { toggleFavorite, recordView, folderName } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router } from '../nav.js';
import { ACCESS } from '../data/mock.js';

function rel(iso: any) {
  if (!iso) return '—';
  const d = Math.round((Date.now() - +new Date(iso)) / 864e5);
  if (d <= 0) return 'today'; if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`; if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}

export function DashboardCard({ d }: any) {
  useDashStore();
  const [hov, setHov] = useState(false);
  const counts: any = { kpi: 0, chart: 0, shortcut: 0 };
  d.tiles.forEach((t: any) => { counts[t.type] = (counts[t.type] || 0) + 1; });
  const audience = d.access === 'public' ? 'Everyone with portal access' : d.access === 'private' ? `Only ${d.owner}` : 'Service Desk group · +4 technicians';
  const openIt = () => { recordView(d); router.push(`/dashboard/${d.id}`); };
  const acc = (ACCESS as any)[d.access];
  return (
    <div className="dc-DashboardCard card dcard" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="preview" onClick={openIt}><MiniPreview tiles={d.tiles} /></div>

      <div className="top">
        <button className={`star ${d.favorite ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(d); }} title={d.favorite ? 'Unfavorite' : 'Add to favorites'}>
          <Icon name={d.favorite ? 'star-fill' : 'star'} size={16} />
        </button>
        <DashboardMenu d={d} onOpen={openIt} />
      </div>

      <div className="body" onClick={openIt}>
        <div className="name-row">
          <span className="name ellip">{d.name}</span>
          {d.predefined && <span className="chip badge-pre" title="Predefined / system">Predefined</span>}
          {d.certified && <span className="chip chip-green" title="Certified official board"><Icon name="check" size={12} /></span>}
        </div>
        <div className="desc">{d.description || 'No description'}</div>
        <div className="meta">
          <span className={`chip ${acc.chip}`}><Icon name={acc.icon} size={12} /> {acc.label}</span>
          {d.category && <span className="chip">{d.category}</span>}
          <span className="dot-sep">·</span>
          <span className="mtxt">{d.owner}</span>
          <span className="dot-sep">·</span>
          <span className="mtxt">{rel(d.updated)}</span>
        </div>
      </div>

      {/* Rich hover tooltip: contents + access (P4) */}
      {hov && (
        <div className="tt card-tt">
          <div className="tt-h">{d.name}</div>
          <div className="tt-row"><Icon name="kpi" size={13} /> {counts.kpi} KPIs · {counts.chart} Widgets · {counts.shortcut} Shortcuts</div>
          <div className="tt-row"><Icon name="folder" size={13} /> {folderName(d.folder)}{d.category && <> · {d.category}</>}</div>
          <div className="tt-row"><Icon name={acc.icon} size={13} /> {audience}</div>
          <div className="tt-row muted2"><Icon name="user" size={13} /> {d.owner} · updated {rel(d.updated)}</div>
        </div>
      )}
    </div>
  );
}
