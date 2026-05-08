import { createContext, useContext, useState, cloneElement, type HTMLAttributes, type MouseEvent, type ReactElement, type ReactNode } from "react";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

type TriggerProps = HTMLAttributes<HTMLElement> & {
  onClick?: (event: MouseEvent) => void;
};

interface PopoverTriggerProps {
  asChild?: boolean;
  children: ReactElement<TriggerProps>;
}

export function PopoverTrigger({ asChild = false, children }: PopoverTriggerProps) {
  const context = useContext(PopoverContext);
  if (!context) return children;

  const { open, setOpen } = context;
  const handleClick = (event: MouseEvent) => {
    if (children.props.onClick) {
      children.props.onClick(event);
    }
    setOpen(!open);
  };

  if (asChild) {
    return cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": "dialog",
    });
  }

  return (
    <button type="button" onClick={handleClick} aria-expanded={open} aria-haspopup="dialog">
      {children}
    </button>
  );
}

interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

export function PopoverContent({ align = "center", className = "", ...props }: PopoverContentProps) {
  const context = useContext(PopoverContext);
  if (!context || !context.open) return null;

  const alignClass =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute z-50 mt-2 ${alignClass} ${className}`}
      {...props}
    />
  );
}
