import './DashboardTable.css';
import { Icon } from '../ui/primitives';
import { DashboardMenu } from './DashboardMenu';
import { toggleFavorite, recordView, folderName } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router } from '../nav.js';
import { ACCESS } from '../data/mock.js';

function rel(iso: any) { if (!iso) return '—'; const d = Math.round((Date.now() - +new Date(iso)) / 864e5); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d}d ago` : d < 365 ? `${Math.round(d / 30)}mo ago` : `${Math.round(d / 365)}y ago`; }
function open(d: any) { recordView(d); router.push(`/dashboard/${d.id}`); }
function initials(n: string) { return n.split(' ').map((s) => s[0]).join('').slice(0, 2); }

export function DashboardTable({ items }: any) {
  useDashStore();
  return (
    <div className="dc-DashboardTable card tbl">
      <div className="th">
        <span></span><span>Name</span><span>Location</span><span>Access</span><span>Updated</span><span>Owner</span><span></span>
      </div>
      {items.map((d: any) => {
        const acc = (ACCESS as any)[d.access];
        return (
          <div key={d.id} className="tr" onClick={() => open(d)}>
            <button className={`star ${d.favorite ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(d); }}><Icon name={d.favorite ? 'star-fill' : 'star'} size={15} /></button>
            <div className="nm">
              <Icon name="layout" size={15} className="muted" />
              <span className="ellip">{d.name}</span>
              {d.predefined && <span className="chip badge-pre sm">Predefined</span>}
              {d.default && <span className="chip chip-primary sm"><Icon name="pin" size={10} /></span>}
            </div>
            <span className="loc muted">{folderName(d.folder)}</span>
            <span><span className={`chip ${acc.chip}`}><Icon name={acc.icon} size={11} /> {acc.label}</span></span>
            <span className="muted">{rel(d.updated)}</span>
            <span className="own"><span className="av">{initials(d.owner)}</span> <span className="muted ellip">{d.owner}</span></span>
            <span className="act" onClick={(e) => e.stopPropagation()}><DashboardMenu d={d} onOpen={() => open(d)} /></span>
          </div>
        );
      })}
      {!items.length && <div className="tr empty"><span></span><span className="muted">No dashboards.</span></div>}
    </div>
  );
}
