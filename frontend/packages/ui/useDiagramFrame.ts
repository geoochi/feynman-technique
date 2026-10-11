import { useEffect, useRef, useState } from "react";

// Match SVG coordinates to the viewport while preserving equal scales on both axes.
export function useDiagramFrame(width: number, initialHeight: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [height, setHeight] = useState(initialHeight);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      if (box.width > 0 && box.height > 0)
        setHeight((box.height / box.width) * width);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [width]);
  return { ref, width, height };
}
