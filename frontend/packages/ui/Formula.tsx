import katex from "katex";
import "katex/dist/katex.min.css";
export function Formula({ math }: { math: string }) {
  return (
    <div
      aria-label={math}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(math, {
          throwOnError: false,
          output: "htmlAndMathml",
          displayMode: true,
          trust: false,
        }),
      }}
    />
  );
}
