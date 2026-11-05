import { interfazDispositivo } from '../../devices/interfaz';

export function renderizarModuloDispositivo(): string {
  return `
    <section id="tab-dispositivo" class="tab-view">
      ${interfazDispositivo}
    </section>
  `;
}
