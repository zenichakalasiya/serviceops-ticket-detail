/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit, MoreHorizontal, Briefcase } from 'lucide-react';
import { renderCatalogIcon, getIconBackgroundColor } from '../CatalogIconUtils';

interface ServiceRequestTabContentProps {
  serviceRequestItems: any[];
  setServiceRequestItems: (items: any[]) => void;
  expandedItemIds: string[];
  setExpandedItemIds: (ids: string[]) => void;
  setShowServiceCatalog: (show: boolean) => void;
  setEditingItem: (item: any) => void;
  setEditItemQuantity: (quantity: number) => void;
  setEditProcessor: (processor: string) => void;
  setEditRAM: (ram: string) => void;
  setEditStorage: (storage: string) => void;
  setEditDisplay: (display: string) => void;
  setEditGraphics: (graphics: string) => void;
  setEditColor: (color: string) => void;
  setShowEditItemPopup: (show: boolean) => void;
  getStatusStyle: (status: string) => { dot: string };
}

export function ServiceRequestTabContent({
  serviceRequestItems,
  setServiceRequestItems,
  expandedItemIds,
  setExpandedItemIds,
  setShowServiceCatalog,
  setEditingItem,
  setEditItemQuantity,
  setEditProcessor,
  setEditRAM,
  setEditStorage,
  setEditDisplay,
  setEditGraphics,
  setEditColor,
  setShowEditItemPopup,
  getStatusStyle
}: ServiceRequestTabContentProps) {
  const [showServiceRequestItemStatus, setShowServiceRequestItemStatus] = useState<string | null>(null);
  const [showServiceRequestMenu, setShowServiceRequestMenu] = useState<string | null>(null);
  const serviceRequestStatusRef = useRef<HTMLDivElement>(null);
  const serviceRequestMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceRequestStatusRef.current && !serviceRequestStatusRef.current.contains(event.target as Node)) {
        setShowServiceRequestItemStatus(null);
      }
      if (serviceRequestMenuRef.current && !serviceRequestMenuRef.current.contains(event.target as Node)) {
        setShowServiceRequestMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-6 py-6">
      <div className="space-y-4">
        {/* Empty State */}
        {serviceRequestItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="size-20 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
              <Briefcase className="size-10 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#364658] mb-2">No Items in Service Request</h3>
            <p className="text-sm text-[#7B8FA5] text-center mb-6 max-w-md">
              Start building your service request by adding items from the catalog. Browse and select the products or services you need.
            </p>
            <button 
              className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
              onClick={() => setShowServiceCatalog(true)}
            >
              <Plus className="size-4" />
              Browse Catalog
            </button>
          </div>
        ) : (
          <>
            {/* Render all service request items */}
            {serviceRequestItems.map((item) => (
              <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg hover:border-[#D1D5DB] transition-colors">
                {/* Accordion Header */}
                <div 
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => {
                    if (expandedItemIds.includes(item.id)) {
                      setExpandedItemIds(expandedItemIds.filter(id => id !== item.id));
                    } else {
                      setExpandedItemIds([...expandedItemIds, item.id]);
                    }
                  }}
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
                    {/* Status Dropdown */}
                    <div className="relative" ref={serviceRequestStatusRef}>
                      <button
                        className="px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-2 transition-colors hover:opacity-80"
                        style={{ color: '#364658' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowServiceRequestItemStatus(showServiceRequestItemStatus === item.id ? null : item.id);
                        }}
                      >
                        <div className={`size-2 rounded-full ${getStatusStyle(item.status || 'Requested').dot}`}></div>
                        {item.status || 'Requested'}
                        <ChevronDown className="size-4" />
                      </button>
                      
                      {/* Status Dropdown Menu */}
                      {showServiceRequestItemStatus === item.id && (
                        <div 
                          className="app-menu absolute left-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[9999]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {['Requested', 'In Progress', 'Delivered'].map((status) => (
                            <button
                              key={status}
                              className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Update item status
                                const updatedItems = serviceRequestItems.map(i => 
                                  i.id === item.id ? { ...i, status } : i
                                );
                                setServiceRequestItems(updatedItems);
                                setShowServiceRequestItemStatus(null);
                              }}
                            >
                              <div className={`size-2 rounded-full ${getStatusStyle(status).dot}`}></div>
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative" ref={serviceRequestMenuRef}>
                      <button 
                        className="p-2 hover:bg-[#F3F4F6] rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowServiceRequestMenu(showServiceRequestMenu === item.id ? null : item.id);
                        }}
                      >
                        <MoreHorizontal className="size-5 text-[#6B7280]" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showServiceRequestMenu === item.id && (
                        <div 
                          className="app-menu absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-[9999]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full px-4 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowServiceRequestMenu(null);
                              // Open edit popup with item data
                              setEditingItem(item);
                              setEditItemQuantity(item.quantity);
                              setEditProcessor(item.configuration?.processor || 'Apple M3 Pro');
                              setEditRAM(item.configuration?.ram || '16 GB');
                              setEditStorage(item.configuration?.storage || '512 GB SSD');
                              setEditDisplay(item.configuration?.display || '14" Retina');
                              setEditGraphics(item.configuration?.graphics || 'Integrated GPU');
                              setEditColor(item.configuration?.color || 'Space Gray');
                              setShowEditItemPopup(true);
                            }}
                          >
                            <Edit className="size-4 text-[#6B7280]" />
                            Edit
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowServiceRequestMenu(null);
                              // Remove item from service request
                              setServiceRequestItems(serviceRequestItems.filter(i => i.id !== item.id));
                              setExpandedItemIds(expandedItemIds.filter(id => id !== item.id));
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
                {expandedItemIds.includes(item.id) && (
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
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">Processor</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.processor}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">RAM</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.ram}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">Storage</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.storage}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">Display</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.display}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">Graphics</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.graphics}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#7B8FA5] mb-1">Color</div>
                          <div className="text-[13px] font-medium text-[#364658]">{item.configuration.color}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Item Button */}
            <button 
              className="w-full px-4 py-3 bg-white border-2 border-dashed border-[#DFE5ED] text-[#7B8FA5] text-sm font-medium rounded-lg hover:bg-[#F9FAFB] hover:border-[#3D8BD0] hover:text-[#3D8BD0] transition-colors flex items-center justify-center gap-2"
              onClick={() => setShowServiceCatalog(true)}
            >
              <Plus className="size-4" />
              Add Item
            </button>
          </>
        )}
      </div>
    </div>
  );
}
