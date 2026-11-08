import RequireAuth from '@/components/require-auth';
import EcRater from '@/components/ec-rater';

export const metadata = {
  title: 'EC Rater',
  description:
    'Rank your extracurriculars and get concrete advice on turning them into meaningful, credible activity for supplemental applications.',
};

export default function EcRaterPage() {
  return (
    <div className="page-container">
      <RequireAuth what="the EC rater">
        <EcRater />
      </RequireAuth>
    </div>
  );
}
