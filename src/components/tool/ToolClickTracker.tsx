'use client';

import { useState } from 'react';

interface ToolClickTrackerProps {
  slug: string;
  url: string;
  children: React.ReactNode;
}

export function ToolClickTracker({ slug, url, children }: ToolClickTrackerProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (clicked) return;
    setClicked(true);

    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: slug, affiliateUrl: url }),
      });
    } catch (error) {
      // ignore tracking errors
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setClicked(false);
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
