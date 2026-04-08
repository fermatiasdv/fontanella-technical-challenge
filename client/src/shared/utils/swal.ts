import Swal from 'sweetalert2';

// ─── Theme tokens (aligned with app's Material You palette) ──────────────────
const PRIMARY   = '#6750a4';
const DANGER    = '#ba1a1a';
const NEUTRAL   = '#79747e';

// ─── Pre-styled toast (corner notification, non-blocking) ────────────────────
const Toast = Swal.mixin({
  toast:              true,
  position:           'top-end',
  showConfirmButton:  false,
  timer:              2800,
  timerProgressBar:   true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────
export const swal = {
  /**
   * Async confirmation dialog before a destructive action.
   * Returns true if the user confirmed.
   */
  confirmDelete: async (itemName: string): Promise<boolean> => {
    const result = await Swal.fire({
      title:              '¿Eliminar?',
      html:               `<span style="color:#49454f">${itemName}</span><br><span style="font-size:0.85rem;color:#79747e">Esta acción no se puede deshacer.</span>`,
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonText:  'Sí, eliminar',
      cancelButtonText:   'Cancelar',
      confirmButtonColor: DANGER,
      cancelButtonColor:  NEUTRAL,
      reverseButtons:     true,
      focusCancel:        true,
    });
    return result.isConfirmed;
  },

  /** Small success toast (top-right corner). */
  success: (message: string) =>
    Toast.fire({ icon: 'success', title: message }),

  /** Small error toast (top-right corner). */
  errorToast: (message: string) =>
    Toast.fire({ icon: 'error', title: message, timer: 4000 }),

  /** Full error dialog for critical / blocking failures. */
  errorDialog: (title: string, message: string) =>
    Swal.fire({
      icon:               'error',
      title,
      text:               message,
      confirmButtonColor: PRIMARY,
    }),
};
