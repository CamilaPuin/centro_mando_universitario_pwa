import type { ReactElement } from 'react';

interface NavegacionTabsProps {
  tabActiva: string;
  onNavigate: (tabId: string) => void;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: ReactElement;
}

const tabs: TabDefinition[] = [
  {
    id: 'tab-resumen',
    label: 'Hoy',
    icon: <path d="M3.75 10.5 12 3.75l8.25 6.75v9a.75.75 0 0 1-.75.75h-5.25v-6h-4.5v6H4.5a.75.75 0 0 1-.75-.75v-9Z" />
  },
  {
    id: 'tab-asignaturas',
    label: 'Materias',
    icon: <path d="M4.5 5.25h10.125A2.625 2.625 0 0 1 17.25 7.875V20.25H7.125A2.625 2.625 0 0 1 4.5 17.625V5.25Zm12.75 3h2.25v12h-2.25M8.25 9h6M8.25 12.75h6" />
  },
  {
    id: 'tab-entregas',
    label: 'Entregas',
    icon: <path d="M8.25 5.25h-3A1.5 1.5 0 0 0 3.75 6.75v12A1.5 1.5 0 0 0 5.25 20.25h13.5a1.5 1.5 0 0 0 1.5-1.5v-12a1.5 1.5 0 0 0-1.5-1.5h-3M8.25 5.25a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5v1.5h-7.5v-1.5Zm-.75 7.5 2.25 2.25 6-6" />
  },
  {
    id: 'tab-calendario',
    label: 'Calendario',
    icon: <path d="M7.5 3.75v3m9-3v3m-12 3h15m-15-3h15a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-10.5a1.5 1.5 0 0 1 1.5-1.5Z" />
  },
  {
    id: 'tab-progreso',
    label: 'Progreso',
    icon: <path d="M4.5 19.5V12m5 7.5V7.5m5 12V4.5m5 15v-9" />
  }
];

export function NavegacionTabs({ tabActiva, onNavigate }: NavegacionTabsProps) {
  return (
    <nav className="nav-tabs" aria-label="Secciones principales">
      {tabs.map(({ id, label, icon }) => {
        const activa = tabActiva === id;
        return (
          <button
            key={id}
            className={activa ? 'tab-btn active' : 'tab-btn'}
            type="button"
            aria-current={activa ? 'page' : undefined}
            aria-controls={id}
            onClick={() => onNavigate(id)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">{icon}</svg>
            <span className="tab-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
