/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, ChevronLeft, ChevronDown, Plus, Minus } from 'lucide-react';
import { renderCatalogIcon, getIconBackgroundColor } from '../CatalogIconUtils';
import { useEffect, useRef } from 'react';

interface EditItemPopupProps {
  editingItem: any;
  editItemQuantity: number;
  setEditItemQuantity: (value: number) => void;
  editProcessor: string;
  setEditProcessor: (value: string) => void;
  editRAM: string;
  setEditRAM: (value: string) => void;
  editStorage: string;
  setEditStorage: (value: string) => void;
  editDisplay: string;
  setEditDisplay: (value: string) => void;
  editGraphics: string;
  setEditGraphics: (value: string) => void;
  editColor: string;
  setEditColor: (value: string) => void;
  showEditProcessorDropdown: boolean;
  setShowEditProcessorDropdown: (value: boolean) => void;
  showEditRAMDropdown: boolean;
  setShowEditRAMDropdown: (value: boolean) => void;
  showEditStorageDropdown: boolean;
  setShowEditStorageDropdown: (value: boolean) => void;
  showEditDisplayDropdown: boolean;
  setShowEditDisplayDropdown: (value: boolean) => void;
  showEditGraphicsDropdown: boolean;
  setShowEditGraphicsDropdown: (value: boolean) => void;
  showEditColorDropdown: boolean;
  setShowEditColorDropdown: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditItemPopup({
  editingItem,
  editItemQuantity,
  setEditItemQuantity,
  editProcessor,
  setEditProcessor,
  editRAM,
  setEditRAM,
  editStorage,
  setEditStorage,
  editDisplay,
  setEditDisplay,
  editGraphics,
  setEditGraphics,
  editColor,
  setEditColor,
  showEditProcessorDropdown,
  setShowEditProcessorDropdown,
  showEditRAMDropdown,
  setShowEditRAMDropdown,
  showEditStorageDropdown,
  setShowEditStorageDropdown,
  showEditDisplayDropdown,
  setShowEditDisplayDropdown,
  showEditGraphicsDropdown,
  setShowEditGraphicsDropdown,
  showEditColorDropdown,
  setShowEditColorDropdown,
  onClose,
  onSave
}: EditItemPopupProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = dropdownRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setShowEditProcessorDropdown(false);
        setShowEditRAMDropdown(false);
        setShowEditStorageDropdown(false);
        setShowEditDisplayDropdown(false);
        setShowEditGraphicsDropdown(false);
        setShowEditColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[100]"
        onClick={onClose}
      />
      
      {/* Slide-in Panel */}
      <div className="fixed right-0 top-0 h-screen w-[600px] max-w-[95vw] bg-white shadow-2xl z-[110] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#364658]">Edit Item</h2>
          <button 
            className="p-2 hover:bg-[#F3F4F6] rounded transition-colors"
            onClick={onClose}
          >
            <X className="size-5 text-[#6B7280]" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Product Header */}
            <div className="flex gap-4 items-start">
              {/* Product Image */}
              <div className={`size-[72px] rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBackgroundColor(editingItem.icon)}`}>
                {renderCatalogIcon(editingItem.icon, 'large')}
              </div>
              
              {/* Product Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-[#364658] mb-1 text-[16px]">{editingItem.name}</h3>
                <p className="text-[14px] text-[#7B8FA5] mb-2">{editingItem.category}</p>
                <p className="text-[14px] text-[#7B8FA5] leading-relaxed">
                  {editingItem.shortDescription || 'High-performance laptop designed for professionals. Features M3 Pro chip and Retina display.'}
                </p>
              </div>
              
              {/* Price */}
              <div className="text-right">
                <span className="text-[16px] font-bold text-[#3D8BD0]">{editingItem.price}</span>
              </div>
            </div>
            
            {/* Configuration Section */}
            <div>
              <h4 className="text-[15px] font-semibold text-[#364658] mb-3">Laptop Configuration</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" ref={dropdownRef}>
                {/* Processor Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Processor</label>
                  <button
                    onClick={() => setShowEditProcessorDropdown(!showEditProcessorDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editProcessor}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditProcessorDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['Apple M3 Pro', 'Apple M3 Max', 'Intel Core i7', 'Intel Core i9'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditProcessor(option);
                            setShowEditProcessorDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* RAM Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">RAM</label>
                  <button
                    onClick={() => setShowEditRAMDropdown(!showEditRAMDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editRAM}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditRAMDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['8 GB', '16 GB', '32 GB', '64 GB'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditRAM(option);
                            setShowEditRAMDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Storage Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Storage</label>
                  <button
                    onClick={() => setShowEditStorageDropdown(!showEditStorageDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editStorage}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditStorageDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditStorage(option);
                            setShowEditStorageDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Display Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Display</label>
                  <button
                    onClick={() => setShowEditDisplayDropdown(!showEditDisplayDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editDisplay}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditDisplayDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['14" Retina', '16" Retina', '13" LED', '15" LED'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditDisplay(option);
                            setShowEditDisplayDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Graphics Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Graphics</label>
                  <button
                    onClick={() => setShowEditGraphicsDropdown(!showEditGraphicsDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editGraphics}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditGraphicsDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['Integrated GPU', 'Dedicated GPU', 'High Performance GPU'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditGraphics(option);
                            setShowEditGraphicsDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Color Dropdown */}
                <div className="relative">
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Color</label>
                  <button
                    onClick={() => setShowEditColorDropdown(!showEditColorDropdown)}
                    className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[14px] text-[#364658] hover:border-[#3D8BD0] transition-colors flex items-center justify-between"
                  >
                    <span>{editColor}</span>
                    <ChevronDown className="size-4 text-[#7B8FA5]" />
                  </button>
                  {showEditColorDropdown && (
                    <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {['Space Gray', 'Silver', 'Gold', 'Midnight'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEditColor(option);
                            setShowEditColorDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <h4 className="text-[15px] font-semibold text-[#364658] mb-3">Additional Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#7B8FA5]">Availability</span>
                  <span className="text-[13px] text-[#364658] font-medium">In Stock</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#7B8FA5]">Delivery Time</span>
                  <span className="text-[13px] text-[#364658] font-medium">2-3 Business Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#7B8FA5]">Warranty</span>
                  <span className="text-[13px] text-[#364658] font-medium">1 Year</span>
                </div>
              </div>
            </div>
            
            {/* Items Requested Table */}
            <div>
              <h4 className="text-[15px] font-semibold text-[#364658] mb-3">Items requested</h4>
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#364658]">Items requested</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#364658]">Quantity</th>
                      <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#364658]">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 text-[14px] text-[#364658]">{editingItem.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 w-fit">
                          <button
                            onClick={() => setEditItemQuantity(Math.max(1, editItemQuantity - 1))}
                            className="size-7 flex items-center justify-center border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] transition-colors"
                          >
                            <Minus className="size-3 text-[#6B7280]" />
                          </button>
                          <span className="text-[14px] text-[#364658] font-medium w-8 text-center">{editItemQuantity}</span>
                          <button
                            onClick={() => setEditItemQuantity(editItemQuantity + 1)}
                            className="size-7 flex items-center justify-center border border-[#DFE5ED] rounded hover:bg-[#F3F4F6] transition-colors"
                          >
                            <Plus className="size-3 text-[#6B7280]" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[14px] font-medium text-[#364658]">
                        ${(parseFloat(editingItem.price.replace('$', '').replace(',', '')) * editItemQuantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
                      <td colSpan={2} className="px-4 py-3 text-[14px] font-semibold text-[#364658]">Total</td>
                      <td className="px-4 py-3 text-right text-[15px] font-bold text-[#3D8BD0]">
                        ${(parseFloat(editingItem.price.replace('$', '').replace(',', '')) * editItemQuantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-[#DFE5ED] rounded text-[14px] font-medium text-[#364658] hover:bg-[#F5F7FA] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2.5 bg-[#3D8BD0] rounded text-[14px] font-medium text-white hover:bg-[#2C6B9F] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}