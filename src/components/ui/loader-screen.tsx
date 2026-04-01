import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

const PATTERNS = [
  // Pattern A: [1,1,1,1] | [2,2] | [1,3]
  [
    [
      { key: "a-r1-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "a-r1-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
      { key: "a-r1-i3", className: "row-span-1 lg:col-span-1 hidden lg:block" },
      { key: "a-r1-i4", className: "row-span-1 lg:col-span-1 hidden lg:block" },
    ],
    [
      { key: "a-r2-i1", className: "row-span-1 lg:col-span-2 sm:col-span-1 col-span-1" },
      { key: "a-r2-i2", className: "row-span-1 lg:col-span-2 sm:col-span-1 hidden sm:block lg:block" },
    ],
    [
      { key: "a-r3-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "a-r3-i2", className: "row-span-1 lg:col-span-3 sm:col-span-1 hidden sm:block lg:block" },
    ],
  ],
  // Pattern B: [2,2] | [1,1,1,1] | [3,1]
  [
    [
      { key: "b-r1-i1", className: "row-span-1 lg:col-span-2 sm:col-span-1 col-span-1" },
      { key: "b-r1-i2", className: "row-span-1 lg:col-span-2 sm:col-span-1 hidden sm:block lg:block" },
    ],
    [
      { key: "b-r2-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "b-r2-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
      { key: "b-r2-i3", className: "row-span-1 lg:col-span-1 hidden lg:block" },
      { key: "b-r2-i4", className: "row-span-1 lg:col-span-1 hidden lg:block" },
    ],
    [
      { key: "b-r3-i1", className: "row-span-1 lg:col-span-3 sm:col-span-1 col-span-1" },
      { key: "b-r3-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
    ],
  ],
  [
    [
      { key: "c-r1-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "c-r1-i2", className: "row-span-1 lg:col-span-2 sm:col-span-1 hidden sm:block lg:block" },
      { key: "c-r1-i3", className: "row-span-1 lg:col-span-1 hidden lg:block" },
    ],
    [
      { key: "c-r2-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "c-r2-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
      { key: "c-r2-i3", className: "row-span-1 lg:col-span-2 hidden lg:block" },
    ],
    [
      { key: "c-r3-i1", className: "row-span-1 lg:col-span-4 sm:col-span-2 col-span-1" },
    ],
  ],
  // Pattern D: [3,1] | [2,1,1] | [1,1,2]
  [
    [
      { key: "d-r1-i1", className: "row-span-1 lg:col-span-3 sm:col-span-1 col-span-1" },
      { key: "d-r1-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
    ],
    [
      { key: "d-r2-i1", className: "row-span-1 lg:col-span-2 sm:col-span-1 col-span-1" },
      { key: "d-r2-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
      { key: "d-r2-i3", className: "row-span-1 lg:col-span-1 hidden lg:block" },
    ],
    [
      { key: "d-r3-i1", className: "row-span-1 lg:col-span-1 sm:col-span-1 col-span-1" },
      { key: "d-r3-i2", className: "row-span-1 lg:col-span-1 sm:col-span-1 hidden sm:block lg:block" },
      { key: "d-r3-i3", className: "row-span-1 lg:col-span-2 hidden lg:block" },
    ],
  ],
];

const LoaderScreen = () => {
  const chosen = useMemo(() => {
    const idx = Math.floor(Math.random() * PATTERNS.length);
    return PATTERNS[idx];
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-rows-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full px-2 h-[90vh]">
        {/* Row 1 */}
        {chosen[0].map((item) => (
          <div key={item.key} className={`bg-gray-300 dark:bg-muted/50 rounded-lg animate-pulse ${item.className}`} />
        ))}
        {/* Row 2 */}
        {chosen[1].map((item) => (
          <div key={item.key} className={`bg-gray-300 dark:bg-muted/50 rounded-lg animate-pulse ${item.className}`} />
        ))}
        {/* Row 3 */}
        {chosen[2].map((item) => (
          <div key={item.key} className={`bg-gray-300 dark:bg-muted/50 rounded-lg animate-pulse ${item.className}`} />
        ))}
      </div>
    </div>
  );
};

const HorizontalLoader = () => {
  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-8 bg-gray-200 dark:bg-muted/40 rounded-md animate-pulse",
              i >= 2 && "hidden md:block",
              i >= 4 && "hidden lg:block"
            )} 
          />
        ))}
      </div>
    </div>
  );
};

export { HorizontalLoader };
export default LoaderScreen;