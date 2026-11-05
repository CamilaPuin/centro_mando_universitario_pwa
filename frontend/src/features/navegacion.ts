export function inicializarNavegacion(): void {
  const tabButtons = document.querySelectorAll<HTMLButtonElement>('[data-tab]');
  const tabViews = document.querySelectorAll<HTMLElement>('.tab-view');
  const headerMenus = [
    {
      button: document.getElementById('tools-menu-button') as HTMLButtonElement | null,
      menu: document.getElementById('tools-menu') as HTMLElement | null
    },
    {
      button: document.getElementById('mobile-menu-button') as HTMLButtonElement | null,
      menu: document.getElementById('mobile-nav-menu') as HTMLElement | null
    },
    {
      button: document.getElementById('profile-menu-button') as HTMLButtonElement | null,
      menu: document.getElementById('profile-menu') as HTMLElement | null
    }
  ].filter((entry): entry is { button: HTMLButtonElement; menu: HTMLElement } =>
    entry.button !== null && entry.menu !== null
  );

  const closeHeaderMenus = (): void => {
    headerMenus.forEach(({ button, menu }) => {
      button.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      if (button.id === 'mobile-menu-button') {
        button.setAttribute('aria-label', 'Abrir menú de navegación');
      } else if (button.id === 'profile-menu-button') {
        button.setAttribute('aria-label', 'Abrir menú de perfil');
      }
    });
  };

  const activeTab = document.querySelector<HTMLElement>('.tab-view.active')?.id;
  document.querySelectorAll<HTMLButtonElement>('#mobile-nav-menu [data-tab]').forEach(menuItem => {
    if (menuItem.getAttribute('data-tab') === activeTab) {
      menuItem.setAttribute('aria-current', 'page');
    }
  });

  headerMenus.forEach(({ button, menu }) => {
    button.addEventListener('click', () => {
      const shouldOpen = menu.hidden;
      closeHeaderMenus();
      menu.hidden = !shouldOpen;
      button.setAttribute('aria-expanded', String(shouldOpen));
      if (button.id === 'mobile-menu-button') {
        button.setAttribute('aria-label', shouldOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
      } else if (button.id === 'profile-menu-button') {
        button.setAttribute('aria-label', shouldOpen ? 'Cerrar menú de perfil' : 'Abrir menú de perfil');
      }
    });
  });

  window.addEventListener('close-header-menus', closeHeaderMenus);
  document.addEventListener('pointerdown', event => {
    const target = event.target;
    if (target instanceof Element && !target.closest('.header-menu')) closeHeaderMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openMenu = headerMenus.find(({ menu }) => !menu.hidden);
    if (!openMenu) return;
    closeHeaderMenus();
    openMenu.button.focus();
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      tabViews.forEach(v => v.classList.remove('active'));

      const targetId = btn.getAttribute('data-tab');
      if (targetId) {
        document.getElementById(targetId)?.classList.add('active');
        const primaryTab = document.querySelector<HTMLButtonElement>(`.tab-btn[data-tab="${targetId}"]`);
        primaryTab?.classList.add('active');
        primaryTab?.setAttribute('aria-current', 'page');
        if (btn.classList.contains('popover-item')) btn.setAttribute('aria-current', 'page');

        const toolsButton = document.getElementById('tools-menu-button');
        const profileButton = document.getElementById('profile-menu-button');
        if (targetId === 'tab-pomodoro' || targetId === 'tab-notas') {
          toolsButton?.setAttribute('aria-current', 'page');
        } else {
          toolsButton?.removeAttribute('aria-current');
        }
        if (targetId === 'tab-dispositivo') {
          profileButton?.setAttribute('aria-current', 'page');
        } else {
          profileButton?.removeAttribute('aria-current');
        }
        document.querySelectorAll<HTMLButtonElement>('#mobile-nav-menu [data-tab]').forEach(menuItem => {
          if (menuItem.getAttribute('data-tab') === targetId) {
            menuItem.setAttribute('aria-current', 'page');
          } else {
            menuItem.removeAttribute('aria-current');
          }
        });

        closeHeaderMenus();
        const focusTargetId = btn.getAttribute('data-focus');
        if (focusTargetId) document.getElementById(focusTargetId)?.focus();
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
