"use client";

import { useEffect } from "react";

export function ScrollDock({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(`dock-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [id]);
  return null;
}
