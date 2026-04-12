"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useState } from "react";
import { useCapacitor } from "@/lib/useCapacitor";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

function CapacitorSetup({ children }: { children: ReactNode }) {
  useCapacitor();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));

  return (
    <ConvexProvider client={convex}>
      <CapacitorSetup>{children}</CapacitorSetup>
    </ConvexProvider>
  );
}
