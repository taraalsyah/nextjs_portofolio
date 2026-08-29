import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalender Deadline',
  description: 'Visualisasi jadwal tenggat waktu (due date) seluruh task pada tampilan kalender bulanan.',
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
