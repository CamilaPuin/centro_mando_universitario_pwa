export function inicializarNavegacion(): void {
  const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const tabViews = document.querySelectorAll<HTMLElement>('.tab-view');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      if (targetId) {
        document.getElementById(targetId)?.classList.add('active');
        if (targetId !== 'tab-pomodoro' && document.body.classList.contains('focus-mode')) {
          document.body.classList.remove('focus-mode');
          const focusButton = document.getElementById('btn-focus-mode');
          focusButton?.setAttribute('aria-pressed', 'false');
          if (focusButton) focusButton.textContent = 'Activar modo enfoque';
        }
      }
    });
  });

  document.querySelectorAll<HTMLInputElement>('.delivery-check').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const parent = target.closest<HTMLElement>('.delivery-item');
      if (parent) {
        parent.classList.toggle('completed', target.checked);
      }
    });
  });
}
