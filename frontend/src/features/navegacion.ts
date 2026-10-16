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
