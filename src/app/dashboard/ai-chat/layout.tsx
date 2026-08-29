import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'Asisten AI cerdas untuk membantu analisis proyek, pencarian task, dan saran kerja.',
};

export default function AIChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
