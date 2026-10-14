/* Tiny visual preview of a board's tiles for the gallery cards (P1·5 previews). */
import './MiniPreview.css';

const col: Record<string, string> = { kpi: '#7b68ee', chart: '#2f80ed', shortcut: '#1f9d63' };

export function MiniPreview({ tiles }: any) {
  const blocks: string[] = (tiles || []).slice(0, 6).map((t: any) => t.type);
  return (
    <div className="mini dc-MiniPreview">
      {!blocks.length ? (
        <div className="empty"><span>Empty</span></div>
      ) : (
        blocks.map((b, i) => (
          <div key={i} className={`blk ${b}`} style={{ background: col[b] + '22', borderColor: col[b] + '55' }}>
            {b === 'kpi' ? (
              <div className="num" style={{ color: col[b] }} />
            ) : b === 'chart' ? (
              <div className="bars">{[1, 2, 3, 4].map((n) => <i key={n} style={{ background: col[b], height: (30 + n * 14) + '%' }} />)}</div>
            ) : (
              <div className="rows">{[1, 2, 3].map((n) => <i key={n} style={{ background: col[b] }} />)}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
