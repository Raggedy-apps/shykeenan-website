import React from 'react';

export function PinCardSkeleton() {
  return (
    <div className="pin-card-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-desc"></div>
        <div className="skeleton-tags">
          <div className="skeleton-tag"></div>
          <div className="skeleton-tag"></div>
        </div>
      </div>
    </div>
  );
}

export function PinGridSkeleton({ count = 6 }) {
  return (
    <div className="pin-grid-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <PinCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="timeline-skeleton">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="skeleton-timeline-item">
          <div className="skeleton-date"></div>
          <div className="skeleton-desc"></div>
        </div>
      ))}
    </div>
  );
}

export function TagSummarySkeleton() {
  return (
    <div className="tag-summary-skeleton">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="skeleton-tag-item">
          <div className="skeleton-tag-name"></div>
          <div className="skeleton-tag-count"></div>
        </div>
      ))}
    </div>
  );
}
