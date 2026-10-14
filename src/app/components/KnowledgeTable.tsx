import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { KnowledgeArticle } from './KnowledgeListPage';

interface KnowledgeTableProps {
  articles: KnowledgeArticle[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  /** Opens the article (wired once a Knowledge detail page exists). */
  onArticleClick?: (article: KnowledgeArticle) => void;
}

// Publication state → colored dot (same palette as every other list in the product).
const statusDot = (s: KnowledgeArticle['status']) =>
  s === 'Published' ? '#22A06B' : s === 'Draft' ? '#94A3B8' : s === 'Expired' ? '#EF4444' : '#F59E0B';

// Approval state → text tone; "Not Requested" stays neutral so approved/rejected stand out.
const approvalTone = (s: KnowledgeArticle['approvalStatus']) =>
  s === 'Approved' ? '#22A06B' : s === 'Rejected' ? '#DC2626' : s === 'Pending Approval' ? '#D97706' : '#64748B';

// Deterministic avatar tint per author, so the same person keeps the same color everywhere.
const AVATAR_COLORS = ['#3D8BD0', '#8B5CF6', '#F59E0B', '#22A06B', '#EC4899', '#0EA5E9'];
const avatarColor = (name: string) => {
  let n = 0;
  for (let i = 0; i < name.length; i++) n = (n * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
};
const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export function KnowledgeTable({
  articles,
  selected,
  allSelected,
  onSelectAll,
  onSelect,
  onArticleClick,
}: KnowledgeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead className="border-b border-[#e5e7eb]">
          <tr className="bg-white">
            <th className="w-[40px] px-4 py-2.5 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
              />
            </th>
            <th className="min-w-[340px] px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]"><span className="whitespace-nowrap">Name</span></th>
            <th className="min-w-[180px] px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]"><span className="whitespace-nowrap">Author</span></th>
            <th className="min-w-[150px] px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]"><span className="whitespace-nowrap">Status</span></th>
            <th className="min-w-[170px] px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]"><span className="whitespace-nowrap">Approval Status</span></th>
            <th className="min-w-[120px] px-4 py-2.5 text-right text-[12px] font-semibold tracking-wider text-[#364658]"><span className="whitespace-nowrap">Feedback</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {articles.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No articles found in this folder.</td></tr>
          ) : articles.map((a) => (
            <tr key={a.id} className="group transition-colors hover:bg-[#f9fafb]">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={(e) => onSelect(a.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <button
                    onClick={() => onArticleClick?.(a)}
                    className="inline-block flex-shrink-0 rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
                  >{a.id}</button>
                  <button
                    onClick={() => onArticleClick?.(a)}
                    className="block max-w-[380px] truncate text-left text-[12px] text-[#364658] transition-colors hover:text-[#3D8BD0]"
                    title={a.name}
                  >{a.name}</button>
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                <span className="inline-flex items-center gap-2 text-[#364658]">
                  <span
                    className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: avatarColor(a.author) }}
                  >{initials(a.author)}</span>
                  <span className="max-w-[130px] truncate">{a.author}</span>
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: statusDot(a.status) }} />
                  {a.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]" style={{ color: approvalTone(a.approvalStatus) }}>{a.approvalStatus}</td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-[12px]">
                <span className="inline-flex items-center gap-3 text-[#64748B]">
                  <span className="inline-flex items-center gap-1" title={`${a.likes} helpful`}>
                    <ThumbsUp size={13} className="text-[#94A3B8]" />
                    <span className="tabular-nums">{a.likes}</span>
                  </span>
                  <span className="inline-flex items-center gap-1" title={`${a.dislikes} not helpful`}>
                    <ThumbsDown size={13} className="text-[#94A3B8]" />
                    <span className="tabular-nums">{a.dislikes}</span>
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
