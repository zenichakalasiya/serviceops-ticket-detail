"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "./utils";

// Helper to filter out Figma-specific props
const filterFigmaProps = (props: Record<string, any>) => {
  const filtered = { ...props };
  Object.keys(filtered).forEach(key => {
    if (key.startsWith('_fg') || key.startsWith('data-fg')) {
      delete filtered[key];
    }
  });
  return filtered;
};

function TooltipProvider({
  delayDuration = 700,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...filterFigmaProps(props)}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...filterFigmaProps(props)} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const filteredProps = filterFigmaProps(props);
  
  // If asChild is used, we need to clone the child and filter its props too
  if (asChild && React.isValidElement(children)) {
    const childProps = filterFigmaProps(children.props);
    const clonedChild = React.cloneElement(children, childProps);
    return (
      <TooltipPrimitive.Trigger 
        data-slot="tooltip-trigger" 
        asChild 
        {...filteredProps}
      >
        {clonedChild}
      </TooltipPrimitive.Trigger>
    );
  }
  
  return (
    <TooltipPrimitive.Trigger 
      data-slot="tooltip-trigger" 
      asChild={asChild}
      {...filteredProps}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({
  className,
  arrowClassName = "bg-primary fill-primary",
  hideArrow = false,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & { arrowClassName?: string; hideArrow?: boolean }) {
  return (
    /* ⚠️ z-[10200], not z-50. The content is portalled to the BODY, so its z-index competes with
       every full-screen layer in the product — and the Support Portal builder is one, at z-[9000]. At
       z-50 every tooltip opened inside the builder rendered UNDERNEATH it: open, opaque, correctly
       placed, and invisible (the rail's were covered by the design panel). A tooltip must never sit
       behind the content it describes, so it outranks the builder, the drawers (z-9999) and the dialogs
       (z-10000…10051); it stays under the tour's spotlight (z-10500), which should cover it. */
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[10200] w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...filterFigmaProps(props)}
      >
        {children}
        {!hideArrow && <TooltipPrimitive.Arrow className={cn("z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]", arrowClassName)} />}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };