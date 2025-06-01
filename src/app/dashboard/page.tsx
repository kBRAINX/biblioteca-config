'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConfigurationPanel from "@/components/ConfigurationPanel";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ConfigurationPanel />
    </ProtectedRoute>
  );
}
