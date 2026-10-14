/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, Lightbulb, Stethoscope, Lock, Maximize2, Sparkles, ChevronDown, ChevronRight, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, FileText, Paperclip, Image, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Code, Video, Edit } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { useState, useRef, useEffect } from 'react';
import { DiagnosisCard } from './DiagnosisCard';
import { SolutionCard } from '../SolutionCard';

interface ResolutionTabContentProps {
  hasDiagnosis: boolean;
  setHasDiagnosis: (value: boolean) => void;
  hasSolution: boolean;
  setHasSolution: (value: boolean) => void;
  diagnosisData: { content: string; timestamp: string } | null;
  setDiagnosisData: (data: { content: string; timestamp: string } | null) => void;
  solutionData: { content: string; timestamp: string } | null;
  setSolutionData: (data: { content: string; timestamp: string } | null) => void;
  diagnosisText: string;
  setDiagnosisText: (text: string) => void;
  solutionText: string;
  setSolutionText: (text: string) => void;
  showAIAssistMenuDiagnosis: boolean;
  setShowAIAssistMenuDiagnosis: (value: boolean) => void;
  showFormattingMenuDiagnosis: boolean;
  setShowFormattingMenuDiagnosis: (value: boolean) => void;
  showToneSubmenuDiagnosis: boolean;
  setShowToneSubmenuDiagnosis: (value: boolean) => void;
  showAIAssistMenuSolution: boolean;
  setShowAIAssistMenuSolution: (value: boolean) => void;
  showFormattingMenuSolution: boolean;
  setShowFormattingMenuSolution: (value: boolean) => void;
  showToneSubmenuSolution: boolean;
  setShowToneSubmenuSolution: (value: boolean) => void;
}

export function ResolutionTabContent({
  hasDiagnosis,
  setHasDiagnosis,
  hasSolution,
  setHasSolution,
  diagnosisData,
  setDiagnosisData,
  solutionData,
  setSolutionData,
  diagnosisText,
  setDiagnosisText,
  solutionText,
  setSolutionText,
  showAIAssistMenuDiagnosis,
  setShowAIAssistMenuDiagnosis,
  showFormattingMenuDiagnosis,
  setShowFormattingMenuDiagnosis,
  showToneSubmenuDiagnosis,
  setShowToneSubmenuDiagnosis,
  showAIAssistMenuSolution,
  setShowAIAssistMenuSolution,
  showFormattingMenuSolution,
  setShowFormattingMenuSolution,
  showToneSubmenuSolution,
  setShowToneSubmenuSolution
}: ResolutionTabContentProps) {
  // Refs for forms and dropdowns
  const diagnosisFormRef = useRef<HTMLDivElement>(null);
  const solutionFormRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuDiagnosisRef = useRef<HTMLDivElement>(null);
  const formattingMenuDiagnosisRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuSolutionRef = useRef<HTMLDivElement>(null);
  const formattingMenuSolutionRef = useRef<HTMLDivElement>(null);

  const onCloseDiagnosis = () => {
    setHasDiagnosis(false);
    setDiagnosisText('');
    setShowAIAssistMenuDiagnosis(false);
    setShowFormattingMenuDiagnosis(false);
    setShowToneSubmenuDiagnosis(false);
  };

  const onCloseSolution = () => {
    setHasSolution(false);
    setSolutionText('');
    setShowAIAssistMenuSolution(false);
    setShowFormattingMenuSolution(false);
    setShowToneSubmenuSolution(false);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiAssistMenuDiagnosisRef.current && !aiAssistMenuDiagnosisRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuDiagnosis(false);
        setShowToneSubmenuDiagnosis(false);
      }
      if (formattingMenuDiagnosisRef.current && !formattingMenuDiagnosisRef.current.contains(event.target as Node)) {
        setShowFormattingMenuDiagnosis(false);
      }
      if (aiAssistMenuSolutionRef.current && !aiAssistMenuSolutionRef.current.contains(event.target as Node)) {
        setShowAIAssistMenuSolution(false);
        setShowToneSubmenuSolution(false);
      }
      if (formattingMenuSolutionRef.current && !formattingMenuSolutionRef.current.contains(event.target as Node)) {
        setShowFormattingMenuSolution(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll forms into view when they open
  useEffect(() => {
    if (hasDiagnosis && diagnosisFormRef.current) {
      setTimeout(() => {
        diagnosisFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [hasDiagnosis]);

  useEffect(() => {
    if (hasSolution && solutionFormRef.current) {
      setTimeout(() => {
        solutionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [hasSolution]);

  return (
    <div className="px-6 py-6">
      {!hasDiagnosis && !hasSolution && !diagnosisData && !solutionData ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-lg">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <Lightbulb className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Diagnosis or Solution Added</h3>
            <p className="text-[13px] text-[#7B8FA5] mb-6">
              Document the root cause analysis and resolution steps for this service request.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setHasDiagnosis(true)}
                className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
              >
                <Stethoscope className="size-4" />
                Add Diagnosis
              </button>
              <button 
                onClick={() => setHasSolution(true)}
                className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
              >
                <Lightbulb className="size-4" />
                Add Solution
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hasDiagnosis && !diagnosisData && (
            <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={diagnosisFormRef}>
              {/* Diagnosis Header */}
              <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#364658]">Diagnosis</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#DFE5ED] rounded text-[#7B8FA5]">
                    <Lock size={12} />
                    <span className="text-xs">Not visible to requester</span>
                  </div>
                  <button className="text-[#7B8FA5] hover:text-[#364658]">
                    <Maximize2 size={16} />
                  </button>
                  <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onCloseDiagnosis}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Diagnosis Form Content */}
              <div className="p-4">
                {/* Text Area */}
                <div className="mb-4">
                  <textarea
                    value={diagnosisText}
                    onChange={(e) => setDiagnosisText(e.target.value)}
                    placeholder="Add your diagnosis..."
                    className="w-full h-48 text-sm text-[#364658] focus:outline-none bg-transparent resize-none"
                  />
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between">
                  {/* Left Side - AI Assist and Formatting Tools */}
                  <div className="flex items-center gap-1">
                    <div className="relative" ref={aiAssistMenuDiagnosisRef}>
                      <button 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                        onClick={() => setShowAIAssistMenuDiagnosis(!showAIAssistMenuDiagnosis)}
                      >
                        <AiSparkle size={14} />
                        <span>AI Assist</span>
                        <ChevronDown size={12} className="text-[#7B8FA5]" />
                      </button>

                      {/* AI Assist Dropdown Menu */}
                      {showAIAssistMenuDiagnosis && (
                        <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                          <div className="py-2">
                            <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                              Refine
                            </div>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuDiagnosis(false)}
                            >
                              <RefreshCw size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Rephrase</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuDiagnosis(false)}
                            >
                              <TextCursorInput size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Make longer</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuDiagnosis(false)}
                            >
                              <Minimize2 size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Make shorter</span>
                            </button>
                            
                            <div className="relative">
                              <button 
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                                onClick={() => setShowToneSubmenuDiagnosis(!showToneSubmenuDiagnosis)}
                              >
                                <div className="flex items-center gap-2">
                                  <Wand2 size={14} className="text-[#364658]" />
                                  <span className="text-xs text-[#364658]">Change tone</span>
                                </div>
                                <ChevronRight size={14} className="text-[#7B8FA5]" />
                              </button>

                              {/* Tone Submenu */}
                              {showToneSubmenuDiagnosis && (
                                <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                  <div className="py-2">
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuDiagnosis(false);
                                        setShowAIAssistMenuDiagnosis(false);
                                      }}
                                    >
                                      <Briefcase size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Professional</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuDiagnosis(false);
                                        setShowAIAssistMenuDiagnosis(false);
                                      }}
                                    >
                                      <Heart size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Empathetic</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuDiagnosis(false);
                                        setShowAIAssistMenuDiagnosis(false);
                                      }}
                                    >
                                      <Zap size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Concise</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuDiagnosis(false);
                                        setShowAIAssistMenuDiagnosis(false);
                                      }}
                                    >
                                      <FileText size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Formal</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuDiagnosis(false);
                                        setShowAIAssistMenuDiagnosis(false);
                                      }}
                                    >
                                      <SmilePlus size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Friendly</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Formatting Tools */}
                    <div className="relative flex items-center gap-1" ref={formattingMenuDiagnosisRef}>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Attach File">
                        <Paperclip size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Image">
                        <Image size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Link">
                        <Link2 size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Emoji">
                        <Smile size={16} />
                      </button>
                      
                      <button 
                        className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]"
                        onClick={() => setShowFormattingMenuDiagnosis(!showFormattingMenuDiagnosis)}
                      >
                        <Type size={16} />
                      </button>

                      {/* All Formatting Options Dropdown */}
                      {showFormattingMenuDiagnosis && (
                        <div className="app-menu absolute left-0 bottom-full mb-2 bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bold">
                              <Bold size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Italic">
                              <Italic size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Underline">
                              <Underline size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bulleted List">
                              <List size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Numbered List">
                              <ListOrdered size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 1">
                              <Heading1 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 2">
                              <Heading2 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 3">
                              <Heading3 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Left">
                              <AlignLeft size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Center">
                              <AlignCenter size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Right">
                              <AlignRight size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Justify">
                              <AlignJustify size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Code">
                              <Code size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Link">
                              <Link2 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Video">
                              <Video size={16} />
                            </button>
                            <button 
                              className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" 
                              title="Close"
                              onClick={() => setShowFormattingMenuDiagnosis(false)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Add Button */}
                  <button 
                    onClick={() => {
                      if (diagnosisText.trim()) {
                        setDiagnosisData({
                          content: diagnosisText,
                          timestamp: new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                        });
                        setDiagnosisText('');
                        setHasDiagnosis(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-[#3D8BD0] text-white rounded hover:bg-[#2F7AB8] text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display Diagnosis Card */}
          {diagnosisData && (
            <DiagnosisCard 
              content={diagnosisData.content}
              timestamp={diagnosisData.timestamp}
              onEdit={() => {
                setDiagnosisText(diagnosisData.content);
                setDiagnosisData(null);
                setHasDiagnosis(true);
              }}
              onDelete={() => setDiagnosisData(null)}
            />
          )}

          {hasSolution && !solutionData && (
            <div className="mt-6 border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm" ref={solutionFormRef}>
              {/* Solution Header */}
              <div className="rounded-t-[6px] bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#364658]">Solution</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#DFE5ED] rounded text-[#7B8FA5]">
                    <Lock size={12} />
                    <span className="text-xs">Not visible to requester</span>
                  </div>
                  <button className="text-[#7B8FA5] hover:text-[#364658]">
                    <Maximize2 size={16} />
                  </button>
                  <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onCloseSolution}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Solution Form Content */}
              <div className="p-4">
                {/* Text Area */}
                <div className="mb-4">
                  <textarea
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    placeholder="Add your solution..."
                    className="w-full h-48 text-sm text-[#364658] focus:outline-none bg-transparent resize-none"
                  />
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between">
                  {/* Left Side - AI Assist and Formatting Tools */}
                  <div className="flex items-center gap-1">
                    <div className="relative" ref={aiAssistMenuSolutionRef}>
                      <button 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                        onClick={() => setShowAIAssistMenuSolution(!showAIAssistMenuSolution)}
                      >
                        <AiSparkle size={14} />
                        <span>AI Assist</span>
                        <ChevronDown size={12} className="text-[#7B8FA5]" />
                      </button>

                      {/* AI Assist Dropdown Menu */}
                      {showAIAssistMenuSolution && (
                        <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                          <div className="py-2">
                            <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                              Refine
                            </div>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuSolution(false)}
                            >
                              <RefreshCw size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Rephrase</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuSolution(false)}
                            >
                              <TextCursorInput size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Make longer</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => setShowAIAssistMenuSolution(false)}
                            >
                              <Minimize2 size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Make shorter</span>
                            </button>
                            
                            <div className="relative">
                              <button 
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                                onClick={() => setShowToneSubmenuSolution(!showToneSubmenuSolution)}
                              >
                                <div className="flex items-center gap-2">
                                  <Wand2 size={14} className="text-[#364658]" />
                                  <span className="text-xs text-[#364658]">Change tone</span>
                                </div>
                                <ChevronRight size={14} className="text-[#7B8FA5]" />
                              </button>

                              {/* Tone Submenu */}
                              {showToneSubmenuSolution && (
                                <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                  <div className="py-2">
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuSolution(false);
                                        setShowAIAssistMenuSolution(false);
                                      }}
                                    >
                                      <Briefcase size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Professional</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuSolution(false);
                                        setShowAIAssistMenuSolution(false);
                                      }}
                                    >
                                      <Heart size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Empathetic</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuSolution(false);
                                        setShowAIAssistMenuSolution(false);
                                      }}
                                    >
                                      <Zap size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Concise</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuSolution(false);
                                        setShowAIAssistMenuSolution(false);
                                      }}
                                    >
                                      <FileText size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Formal</span>
                                    </button>
                                    
                                    <button 
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                      onClick={() => {
                                        setShowToneSubmenuSolution(false);
                                        setShowAIAssistMenuSolution(false);
                                      }}
                                    >
                                      <SmilePlus size={14} className="text-[#364658]" />
                                      <span className="text-xs text-[#364658]">Friendly</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Formatting Tools */}
                    <div className="relative flex items-center gap-1" ref={formattingMenuSolutionRef}>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Attach File">
                        <Paperclip size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Image">
                        <Image size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Link">
                        <Link2 size={16} />
                      </button>
                      <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Emoji">
                        <Smile size={16} />
                      </button>
                      
                      <button 
                        className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]"
                        onClick={() => setShowFormattingMenuSolution(!showFormattingMenuSolution)}
                      >
                        <Type size={16} />
                      </button>

                      {/* All Formatting Options Dropdown */}
                      {showFormattingMenuSolution && (
                        <div className="app-menu absolute left-0 bottom-full mb-2 bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bold">
                              <Bold size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Italic">
                              <Italic size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Underline">
                              <Underline size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bulleted List">
                              <List size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Numbered List">
                              <ListOrdered size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 1">
                              <Heading1 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 2">
                              <Heading2 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Heading 3">
                              <Heading3 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Left">
                              <AlignLeft size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Center">
                              <AlignCenter size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Right">
                              <AlignRight size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Align Justify">
                              <AlignJustify size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Code">
                              <Code size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Link">
                              <Link2 size={16} />
                            </button>
                            <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Video">
                              <Video size={16} />
                            </button>
                            <button 
                              className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" 
                              title="Close"
                              onClick={() => setShowFormattingMenuSolution(false)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Add Button */}
                  <button 
                    onClick={() => {
                      if (solutionText.trim()) {
                        setSolutionData({
                          content: solutionText,
                          timestamp: new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                        });
                        setSolutionText('');
                        setHasSolution(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-[#3D8BD0] text-white rounded hover:bg-[#2F7AB8] text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display Solution Card */}
          {solutionData && (
            <SolutionCard 
              content={solutionData.content}
              timestamp={solutionData.timestamp}
              onEdit={() => {
                setSolutionText(solutionData.content);
                setSolutionData(null);
                setHasSolution(true);
              }}
              onDelete={() => setSolutionData(null)}
            />
          )}

          {/* Show buttons to add diagnosis/solution when they don't exist */}
          {(diagnosisData || solutionData) && (
            <div className="flex items-center gap-3">
              {!hasDiagnosis && !diagnosisData && (
                <button 
                  onClick={() => setHasDiagnosis(true)}
                  className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                >
                  <Stethoscope className="size-4" />
                  Add Diagnosis
                </button>
              )}
              {!hasSolution && !solutionData && (
                <button 
                  onClick={() => setHasSolution(true)}
                  className="px-4 py-2.5 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors flex items-center gap-2"
                >
                  <Lightbulb className="size-4" />
                  Add Solution
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}