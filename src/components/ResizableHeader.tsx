import React, { useState, useRef, useCallback } from "react";

interface ResizableHeaderProps {
  label: string;
  initialWidth?: number;
  minWidth?: number;
  className?: string;
}

export const ResizableHeader = ({ label, initialWidth = 120, minWidth = 80, className = "" }: ResizableHeaderProps) => {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    isResizing.current = true;
    const startX = mouseDownEvent.pageX;
    const startWidth = width;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(minWidth, startWidth + (mouseMoveEvent.pageX - startX));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [minWidth, width]);

  return (
    <th 
      className={`relative group px-4 py-3 font-semibold text-[11px] uppercase tracking-wider select-none border-r border-slate-100 last:border-r-0 ${className}`}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{label}</span>
      </div>
      <div
        onMouseDown={startResizing}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-10"
      />
    </th>
  );
};
