'use client';
import dynamic from 'next/dynamic';

const ArchitectureCanvas = dynamic(() => import('@/components/canvas/ArchitectureCanvas'), { ssr: false });

export default function Home() {
  return <ArchitectureCanvas />;
}
