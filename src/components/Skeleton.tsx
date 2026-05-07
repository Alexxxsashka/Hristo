import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  circle = false 
}) => {
  return (
    <div 
      className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-900/50 ${className} ${circle ? 'rounded-full' : 'rounded-md'}`}
      style={{ width, height }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/10 dark:via-white/5 to-transparent"
      />
    </div>
  );
};

export const ProductCardSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col sm:flex-row gap-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
        <Skeleton height={150} width={200} className="w-full sm:w-[200px] rounded-2xl" />
        <div className="flex-1 space-y-4 py-2">
          <div className="space-y-2">
            <Skeleton height={28} width="60%" />
            <Skeleton height={16} width="40%" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton height={32} width="100px" />
            <Skeleton height={32} width="100px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/30 rounded-3xl border border-zinc-800 p-4 space-y-4">
      <Skeleton height={250} className="w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton height={24} width="80%" />
        <Skeleton height={16} width="40%" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton height={32} width="30%" />
        <Skeleton height={44} width="45%" className="rounded-xl" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={20} className="flex-1" />
      ))}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900/30 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton height={40} width={40} className="rounded-2xl" />
              <Skeleton height={16} width={60} />
            </div>
            <div className="space-y-2">
              <Skeleton height={12} width={80} />
              <Skeleton height={32} width={120} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/30 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <Skeleton height={24} width="30%" className="mb-8" />
          <Skeleton height={350} className="w-full" />
        </div>
        <div className="bg-white dark:bg-zinc-900/30 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <Skeleton height={24} width="50%" className="mb-8" />
          <Skeleton height={250} circle className="mx-auto mb-8" width={250} />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton height={12} width={100} />
                <Skeleton height={12} width={40} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-12">
      <div className="flex gap-2 mb-8 md:mb-12">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-8">
          <Skeleton className="aspect-square rounded-[32px] sm:rounded-[40px]" />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-32 rounded-[24px] sm:rounded-[32px]" />
            ))}
          </div>
        </div>

        <div className="space-y-8 md:space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-16 md:h-24 w-full" />
            <div className="flex gap-6 md:gap-8">
              <Skeleton className="h-12 md:h-16 w-32" />
              <Skeleton className="h-12 md:h-16 w-32" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 md:h-16 rounded-2xl" />
            <Skeleton className="h-14 md:h-16 rounded-2xl" />
          </div>

          <Skeleton className="h-64 rounded-[32px] md:rounded-[40px]" />
        </div>
      </div>
    </div>
  );
};
