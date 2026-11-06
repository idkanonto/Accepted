import Vault from '@/components/vault';

export const metadata = {
  title: 'Program Vault',
  description:
    'Every Ontario university program requiring a supplemental application — competitive averages, formats, deadlines, and practice prompts.',
};

export default function VaultPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Vault />
    </div>
  );
}
