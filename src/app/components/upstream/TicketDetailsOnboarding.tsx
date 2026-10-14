/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';

/**
 * TicketDetailsOnboarding Component
 * 
 * Displays a first-time user guide when opening the request details drawer.
 * The guide highlights key areas of the interface with tooltips pointing to elements.
 * 
 * The onboarding state is stored in localStorage with the key 'hasSeenTicketDetailsOnboarding'.
 * 
 * To reset the onboarding for testing, run this in the browser console:
 *   localStorage.removeItem('hasSeenTicketDetailsOnboarding');
 * 
 * Then refresh the page and open a ticket.
 */

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
}

interface TicketDetailsOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Your main workspace',
    description: 'Work from the left panel to review the request, switch between work tabs, and stay on top of conversations. The reply box stays fixed at the bottom, so actions are always within reach.',
    targetSelector: '[data-onboarding="main-workspace"]',
    position: 'right',
    highlightPadding: 16
  },
  {
    id: 2,
    title: 'Quick access sidebar',
    description: 'Use this sidebar to switch between supporting views like ServiceOps AI, AI Suggestions, Request Properties, and Activity & Resources without leaving the request.',
    targetSelector: '[data-onboarding="right-sidebar"]',
    position: 'left',
    highlightPadding: 12
  },
  {
    id: 3,
    title: 'Request details, your way',
    description: 'View requests, statuses, additional fields, system fields, and custom fields in one place. Search, filter, or pin important fields to snap the details you need on tap.',
    targetSelector: '[data-onboarding="ticket-properties"]',
    position: 'left',
    highlightPadding: 16
  },
  {
    id: 4,
    title: 'AI help, built in',
    description: 'Use AI to summarize the request, suggest next steps, draft responses, and help update the request faster.',
    targetSelector: '[data-onboarding="ai-prompt-box"]',
    position: 'top',
    highlightPadding: 16
  }
];

export function TicketDetailsOnboarding({ onComplete, onSkip, onStepChange }: TicketDetailsOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const updateHighlight = () => {
      const step = steps[currentStep];
      const targetElement = document.querySelector(step.targetSelector);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);
        
        // Calculate tooltip position based on step position
        const padding = step.highlightPadding || 16;
        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'right':
            top = rect.top + (rect.height / 2) - 100; // Center vertically with offset
            left = rect.right + padding + 20;
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - 100;
            left = rect.left - 420 - padding; // 400px tooltip width + padding
            break;
          case 'top':
            top = rect.top - 200 - padding; // Tooltip height + padding
            left = rect.left + (rect.width / 2) - 200; // Center horizontally
            break;
          case 'bottom':
            top = rect.bottom + padding;
            left = rect.left + (rect.width / 2) - 200;
            break;
          case 'center':
            top = window.innerHeight / 2 - 100;
            left = window.innerWidth / 2 - 200;
            break;
        }

        setTooltipPosition({ top, left });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    
    // Update on scroll
    const drawerContent = document.querySelector('[data-onboarding-container]');
    if (drawerContent) {
      drawerContent.addEventListener('scroll', updateHighlight);
    }

    return () => {
      window.removeEventListener('resize', updateHighlight);
      if (drawerContent) {
        drawerContent.removeEventListener('scroll', updateHighlight);
      }
    };
  }, [currentStep]);

  // Prevent ESC key and other keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleNext = () => {
    if (isTransitioning) return;
    
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setIsTransitioning(false);
        onStepChange?.(nextStep);
      }, 250);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (isTransitioning || currentStep === 0) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setIsTransitioning(false);
      onStepChange?.(prevStep);
    }, 250);
  };

  const step = steps[currentStep];
  const padding = step.highlightPadding || 16;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* SVG mask definition for spotlight cut-out */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: 0, height: 0 }}>
        <defs>
          <mask id="spotlight-mask">
            {/* White background = visible overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle = transparent cut-out hole */}
            {highlightRect && (
              <rect 
                x={highlightRect.left - padding}
                y={highlightRect.top - padding}
                width={highlightRect.width + (padding * 2)}
                height={highlightRect.height + (padding * 2)}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Dark overlay with spotlight cut-out - blocks all interactions */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto transition-all duration-300"
        style={{ 
          mask: 'url(#spotlight-mask)',
          WebkitMask: 'url(#spotlight-mask)'
        }}
      />

      {/* Highlighted section - visual only, not interactive */}
      {highlightRect && (
        <>
          {/* Elevated highlight box - visual emphasis only */}
          <div 
            className="absolute rounded-xl transition-all duration-300 pointer-events-none"
            style={{
              top: highlightRect.top - padding,
              left: highlightRect.left - padding,
              width: highlightRect.width + (padding * 2),
              height: highlightRect.height + (padding * 2),
              backgroundColor: 'transparent',
              boxShadow: '0 0 0 3px rgba(61, 139, 208, 0.8), 0 0 40px rgba(61, 139, 208, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
              zIndex: 2,
              opacity: isTransitioning ? 0 : 1
            }}
          />
        </>
      )}

      {/* Tooltip card - ONLY interactive element */}
      <div
        className="pointer-events-auto absolute w-[400px] max-w-[92vw] rounded-2xl bg-[#1F2937] shadow-2xl transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 3,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.95)' : 'scale(1)'
        }}
      >
        {/* Arrow pointing to highlighted element */}
        {step.position === 'right' && (
          <div 
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '12px solid #1F2937'
            }}
          />
        )}
        
        {step.position === 'left' && (
          <div 
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderLeft: '12px solid #1F2937'
            }}
          />
        )}
        
        {step.position === 'top' && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid #1F2937'
            }}
          />
        )}
        
        {step.position === 'bottom' && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderBottom: '12px solid #1F2937'
            }}
          />
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-3">
            <h3 className="text-[16px] font-semibold text-white leading-tight">
              {step.title}
            </h3>
          </div>
          <p className="text-[14px] text-white/80 leading-relaxed">
            {step.description}
          </p>
          
          {/* Additional details for step 2 (Quick access sidebar) */}
          {step.id === 2 && (
            <div className="mt-4 space-y-2 text-[13px] text-white/70">
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                <span><span className="text-white font-semibold">Request Properties</span> — See all request details and fields.</span>
              </p>
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                <span><span className="text-white font-semibold">Activity & Resources</span> — Manage work updates and view attachments.</span>
              </p>
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>
                <span><span className="text-white font-semibold">AI Suggestions</span> — Discover similar requests and relevant KBs.</span>
              </p>
            </div>
          )}
          
          {/* Additional details for step 3 (Ticket details, your way) */}
          {step.id === 3 && (
            <div className="mt-4 space-y-2 text-[13px] text-white/70">
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <span><span className="text-white font-semibold">Search</span> — Find any field quickly across all request details</span>
              </p>
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                <span><span className="text-white font-semibold">Filter</span> — Show only the fields you need, such as empty fields or pinned ones</span>
              </p>
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0"><line x1="12" x2="12" y1="17" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                <span><span className="text-white font-semibold">Pin</span> — Mark the fields you want easy access to, your view works the way you do.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="text-[13px] text-white/60 font-medium">
            {currentStep + 1}/{steps.length}
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-white text-[#1F2937] text-[13px] font-semibold rounded hover:bg-white/90 transition-colors"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}