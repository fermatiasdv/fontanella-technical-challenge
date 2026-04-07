import type  { ActiveContext } from '../../types/lawyer';

interface ActiveContextCardProps {
  context: ActiveContext;
  onViewProfile?: () => void;
  onRevoke?: () => void;
}

export default function ActiveContextCard({
  context,
  onViewProfile,
  onRevoke,
}: ActiveContextCardProps) {
  return (
    <div className="bg-surface-container-high/50 backdrop-blur-md rounded-xl p-8 border-t border-white/20">
      <h3 className="all-caps-label text-on-surface font-bold mb-6">Active Context</h3>

      {/* Avatar */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-4 ring-8 ring-primary/10">
          <span
            className="material-symbols-outlined text-4xl text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            gavel
          </span>
        </div>
        <p className="font-headline font-extrabold text-xl">{context.lawyer.full_name}</p>
      </div>

      {/* Stats */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
          <span className="text-xs text-on-surface-variant">Appointments</span>
          <span className="text-xs font-bold text-on-surface">{context.appointments} Pending</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
          <span className="text-xs text-on-surface-variant">Timezone</span>
          <span className="text-xs font-bold text-on-surface">{context.lawyer.timezone}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">

        <button
          onClick={onRevoke}
          className="py-3  bg-error-container text-on-error-container rounded-lg text-xs font-bold hover:bg-error/10 transition-colors"
        >
          Delete Lawyer
        </button>
      </div>
    </div>
  );
}
