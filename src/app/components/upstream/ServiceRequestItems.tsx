/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2, Edit, Briefcase, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { renderCatalogIcon, getIconBackgroundColor } from '../CatalogIconUtils';

interface ServiceRequestItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  icon: string;
  configuration?: {
    [key: string]: string;
  };
}

interface ServiceRequestItemsProps {
  items: ServiceRequestItem[];
  expandedItemIds: string[];
  onToggleExpand: (itemId: string) => void;
  onEditItem: (item: ServiceRequestItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export function ServiceRequestItems({
  items,
  expandedItemIds,
  onToggleExpand,
  onEditItem,
  onDeleteItem
}: ServiceRequestItemsProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg hover:border-[#D1D5DB] transition-colors">
          {/* Accordion Header */}
          <div 
            className="p-4 flex items-center gap-4 cursor-pointer"
            onClick={() => onToggleExpand(item.id)}
          >
            {/* Product Icon */}
            <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBackgroundColor(item.icon)}`}>
              {renderCatalogIcon(item.icon, 'medium')}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-medium text-[#364658] mb-1">{item.name}</h4>
              <div className="flex items-center gap-3 text-[13px] text-[#7B8FA5]">
                <span>Quantity: <span className="text-[#364658] font-medium">{item.quantity}</span></span>
                <span className="text-[#D1D5DB]">|</span>
                <span>Price: <span className="text-[#364658] font-medium">{item.price}</span></span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative" ref={showMenu === item.id ? menuRef : null}>
                <button 
                  className="p-2 hover:bg-[#F3F4F6] rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(showMenu === item.id ? null : item.id);
                  }}
                >
                  <MoreHorizontal className="size-5 text-[#6B7280]" />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu === item.id && (
                  <div className="app-menu absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[9999]">
                    <button
                      className="w-full px-4 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(null);
                        onEditItem(item);
                      }}
                    >
                      <Edit className="size-4 text-[#6B7280]" />
                      Edit
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(null);
                        onDeleteItem(item.id);
                      }}
                    >
                      <Trash2 className="size-4 text-[#EF4444]" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <button className="p-2 hover:bg-[#F3F4F6] rounded transition-colors">
                {expandedItemIds.includes(item.id) ? (
                  <ChevronDown className="size-5 text-[#6B7280]" />
                ) : (
                  <ChevronRight className="size-5 text-[#6B7280]" />
                )}
              </button>
            </div>
          </div>

          {/* Accordion Content */}
          {expandedItemIds.includes(item.id) && item.configuration && (
            <div className="border-t border-[#E5E7EB] p-4 bg-[#FAFBFC]">
              {/* Description */}
              <div className="mb-4">
                <h5 className="text-[13px] font-semibold text-[#364658] mb-2">Description</h5>
                <p className="text-[13px] text-[#7B8FA5] leading-relaxed">
                  High-performance laptop designed for professionals. Features the latest Apple M-series chip, 
                  stunning Retina display, and all-day battery life. Perfect for development, design, and creative work.
                </p>
              </div>

              {/* Configuration */}
              <div>
                <h5 className="text-[13px] font-semibold text-[#364658] mb-3">Laptop Configuration</h5>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(item.configuration).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-[11px] text-[#7B8FA5] mb-1">{key}</div>
                      <div className="text-[13px] font-medium text-[#364658]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
