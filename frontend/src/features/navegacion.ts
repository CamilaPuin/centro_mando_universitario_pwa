export function inicializarNavegacion(): () => void {
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

  const menuClickHandlers = headerMenus.map(({ button, menu }) => {
    const handleClick = (): void => {
      const shouldOpen = menu.hidden;
      closeHeaderMenus();
      menu.hidden = !shouldOpen;
      button.setAttribute('aria-expanded', String(shouldOpen));
      if (button.id === 'mobile-menu-button') {
        button.setAttribute('aria-label', shouldOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
      } else if (button.id === 'profile-menu-button') {
        button.setAttribute('aria-label', shouldOpen ? 'Cerrar menú de perfil' : 'Abrir menú de perfil');
      }
    };
    button.addEventListener('click', handleClick);
    return { button, handleClick };
  });

  const handleCloseMenus = (): void => closeHeaderMenus();
  const handlePointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Element && !target.closest('.header-menu')) closeHeaderMenus();
  };
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    const openMenu = headerMenus.find(({ menu }) => !menu.hidden);
    if (!openMenu) return;
    closeHeaderMenus();
    openMenu.button.focus();
  };
  window.addEventListener('close-header-menus', handleCloseMenus);
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleKeyDown);

  const checkboxes = document.querySelectorAll<HTMLInputElement>('.delivery-check');
  const handleDeliveryChange = (event: Event): void => {
    const checkbox = event.currentTarget;
    if (!(checkbox instanceof HTMLInputElement)) return;
    checkbox.closest<HTMLElement>('.delivery-item')?.classList.toggle('completed', checkbox.checked);
  };
  checkboxes.forEach(checkbox => checkbox.addEventListener('change', handleDeliveryChange));

  return () => {
    menuClickHandlers.forEach(({ button, handleClick }) => button.removeEventListener('click', handleClick));
    window.removeEventListener('close-header-menus', handleCloseMenus);
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('keydown', handleKeyDown);
    checkboxes.forEach(checkbox => checkbox.removeEventListener('change', handleDeliveryChange));
  };
}
