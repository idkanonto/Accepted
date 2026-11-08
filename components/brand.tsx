import Link from 'next/link';
import { Check } from 'lucide-react';

export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Accepted home">
      <span className="brand-mark">
        <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="!text-cream">
        Accepted<span>.</span>
      </span>
    </Link>
  );
}
