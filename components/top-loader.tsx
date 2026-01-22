"use client";

import NextTopLoader from "nextjs-toploader";

export function TopLoader() {
  return (
    <NextTopLoader
      color="#3c63e6"
      showSpinner={false}
      shadow="0 0 10px #3c63e6, 0 0 5px #3c63e6"
      height={3}
      crawlSpeed={150}
    />
  );
}
