import { DatabaseProvider } from '@/contexts/DatabaseContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DatabaseProvider>
      {children}
    </DatabaseProvider>
  );
}
