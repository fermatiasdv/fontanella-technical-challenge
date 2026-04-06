import type { ScheduleConflict } from '../../types/lawyer';

interface ScheduleConflictCardProps {
  conflict: ScheduleConflict;
  onResolve?: () => void;
}

export default function ScheduleConflictCard({ conflict, onResolve }: ScheduleConflictCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative overflow-hidden">
      {/* Warning Icon Jewel */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary/10 rounded-bl-full flex items-center justify-end pr-4 pt-4">
        <span className="material-symbols-outlined text-tertiary">warning</span>
      </div>

      <h4 className="font-headline font-bold text-on-surface mb-2">Schedule Conflict</h4>

      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
        {conflict.lawyerName} has a potential hearing overlap on {conflict.date}.
      </p>

      <button
        onClick={onResolve}
        className="text-xs font-bold text-tertiary flex items-center gap-1 hover:underline"
      >
        Resolve Incident
        <span className="material-symbols-outlined text-xs">chevron_right</span>
      </button>
    </div>
  );
}
