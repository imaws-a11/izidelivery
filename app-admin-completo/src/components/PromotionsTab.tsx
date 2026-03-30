import React from 'react';
import PromotionStudio from './PromotionStudio';

export default function PromotionsTab() {
  return (
    <div className="space-y-10 pb-20">
      <PromotionStudio userRole="admin" />
    </div>
  );
}
