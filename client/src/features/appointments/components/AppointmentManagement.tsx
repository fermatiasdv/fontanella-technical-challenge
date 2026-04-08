import { useCallback, useState } from 'react';
import { useAppointments }      from '@/features/appointments/hooks/useAppointments';
import { AppointmentRow }       from '@/features/appointments/components/AppointmentRow';
import { AppointmentFormModal } from '@/features/appointments/components/AppointmentFormModal';
import { useLawyerList }        from '@/shared/hooks/useLawyerList';
import { useClientList }        from '@/shared/hooks/useClientList';
import type { AppointmentAPI }  from '@/features/appointments/types/appointment.types';

export function AppointmentManagement() {
  const { appointments, loading, error, create, update, remove } = useAppointments();
  const { lawyers, loading: lawyersLoading } = useLawyerList();
  const { clients, loading: clientsLoading } = useClientList();

  const [formOpen,        setFormOpen]        = useState(false);
  const [editAppointment, setEditAppointment] = useState<AppointmentAPI | null>(null);

  const lawyerName = useCallback(
    (id: number) => lawyers.find((l) => l.id_lawyer === id)?.full_name ?? `Lawyer #${id}`,
    [lawyers],
  );
  const clientName = useCallback(
    (id: number) => clients.find((c) => c.id_client === id)?.trade_name ?? `Client #${id}`,
    [clients],
  );

  const openCreate = () => { setEditAppointment(null); setFormOpen(true); };
  const openEdit   = (a: AppointmentAPI) => { setEditAppointment(a); setFormOpen(true); };

  const handleSave = async (dto: Parameters<typeof create>[0]) => {
    if (editAppointment) {
      await update(editAppointment.id_appointment, dto);
    } else {
      await create(dto);
    }
  };

  return (
    <>
      <main className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <section className="section-header">
            <div>
              <span className="eyebrow">Appointments</span>
              <h2 className="section-header__title">Scheduled meetings.</h2>
              <p className="section-header__subtitle">Create, review and manage all appointments between lawyers and clients.</p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <span className="material-symbols-outlined">add</span>New Appointment
            </button>
          </section>

          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="appt-table">
            {loading ? (
              <div className="appt-table__loading">
                <span className="material-symbols-outlined anim-spin">progress_activity</span>
                Loading appointments…
              </div>
            ) : appointments.length === 0 ? (
              <div className="appt-table__empty">
                <span className="material-symbols-outlined appt-table__empty-icon" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                <p className="appt-table__empty-text">No appointments yet.</p>
                <button onClick={openCreate} className="appt-table__empty-cta">Schedule the first one →</button>
              </div>
            ) : (
              <div className="appt-table__scroll">
                <table>
                  <thead className="appt-table__head">
                    <tr>{['Subject', 'Lawyer', 'Client', 'Start', 'End', ''].map((h) => <th key={h} className="appt-table__th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <AppointmentRow
                        key={a.id_appointment}
                        appointment={a}
                        lawyerName={lawyerName(a.id_lawyer)}
                        clientName={clientName(a.id_client)}
                        onEdit={openEdit}
                        onDelete={remove}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppointmentFormModal
        isOpen={formOpen}
        editAppointment={editAppointment}
        lawyers={lawyers}
        clients={clients}
        lawyersLoading={lawyersLoading}
        clientsLoading={clientsLoading}
        onClose={() => { setFormOpen(false); setEditAppointment(null); }}
        onSave={handleSave}
      />
    </>
  );
}
