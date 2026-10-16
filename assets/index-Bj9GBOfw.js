(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`
  <div class="device-tools" aria-label="Herramientas del dispositivo">
    <div class="dashboard-panel profile-panel">
      <h2 class="panel-title">Perfil y evidencias</h2>
      <p class="device-help">Toma una foto para tu perfil o selecciona una imagen. La foto se guarda en este dispositivo.</p>
      <div class="profile-actions">
        <button id="btn-open-camera" class="btn btn-save" type="button">Tomar foto</button>
        <button id="btn-choose-photo" class="btn btn-load" type="button">Elegir imagen</button>
        <input id="profile-photo-file" type="file" accept="image/*" capture="user" hidden />
      </div>
      <p id="camera-status" class="device-status" role="status" aria-live="polite">La cámara solo se activa cuando eliges “Tomar foto”.</p>
      <img id="profile-photo-preview" class="profile-photo-preview" alt="Foto guardada del perfil" hidden />
    </div>

    <div class="dashboard-panel record-entry" data-record-key="parcial-proximo" data-record-type="parcial">
      <h2 class="panel-title">Próximo parcial</h2>
      <p class="device-help">El cálculo usa el reloj local del dispositivo y funciona sin conexión.</p>
      <div class="deadline-controls">
        <label for="exam-date">Fecha y hora del parcial:</label>
        <input id="exam-date" class="form-control" type="datetime-local" />
        <button id="btn-calculate-deadline" class="btn btn-load" type="button">Calcular tiempo restante</button>
        <button class="record-delete" type="button" data-delete-key="parcial-proximo" aria-label="Eliminar fecha del próximo parcial" disabled>Eliminar parcial</button>
      </div>
      <p id="exam-countdown" class="device-status" role="status" aria-live="polite">Selecciona la fecha del próximo parcial.</p>
    </div>

    <div class="dashboard-panel undo-panel">
      <h2 class="panel-title">Acciones y sensores</h2>
      <div class="profile-actions">
        <button id="btn-undo-delete" class="btn btn-load" type="button" disabled>↩ Deshacer eliminación</button>
        <button id="btn-toggle-shake" class="btn btn-save" type="button">Activar agitar para deshacer</button>
      </div>
      <p id="shake-status" class="device-status" role="status" aria-live="polite">También puedes deshacer con el botón; el gesto es opcional.</p>
    </div>
  </div>

  <dialog id="dlg-camara" class="camera-dialog" aria-labelledby="camera-dialog-title">
    <div class="camera-dialog-content">
      <h2 id="camera-dialog-title">Capturar foto</h2>
      <video id="camera-video" autoplay playsinline aria-label="Vista previa de la cámara"></video>
      <div class="profile-actions">
        <button id="btn-capture-photo" class="btn btn-save" type="button">Capturar</button>
        <button id="btn-cancel-camera" class="btn btn-load" type="button">Cancelar</button>
      </div>
    </div>
  </dialog>
`;function t(){let t=document.getElementById(`app`),n=new Date().toLocaleDateString(`es-ES`,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`});t.innerHTML=`
    <div class="app-container">
      <header class="top-nav">
        <div class="brand-section">
          <img src="icons/icon-192.png" alt="Centro de Mando Universitario" class="brand-logo" />
          <div>
            <div class="brand-title">Centro de Mando Universitario</div>
            <div class="brand-subtitle">Gestión académica personal</div>
          </div>
        </div>
        <div class="nav-meta">
          <div class="date-pill">
            <span>${n.charAt(0).toUpperCase()+n.slice(1)}</span>
          </div>
          <button id="install-app" class="install-button" type="button" hidden>Instalar Centro de Mando</button>
          <span id="network-status" class="badge online">
            <span class="badge-dot"></span>
            <span>En línea</span>
          </span>
        </div>
      </header>

      <div id="offline-banner" class="offline-banner" role="status" aria-live="polite" hidden>
        Sin conexión: mostrando datos guardados en caché
      </div>
      <p id="ios-install-help" class="ios-install-help" role="note" hidden>
        Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
      </p>

      <main id="main-content">
        <nav class="nav-tabs" aria-label="Secciones del Centro de Mando">
          <button class="tab-btn active" data-tab="tab-resumen">Resumen del Día</button>
          <button class="tab-btn" data-tab="tab-entregas">Tablero de Entregas</button>
          <button class="tab-btn" data-tab="tab-pomodoro">Cronómetro y Pomodoro</button>
          <button class="tab-btn" data-tab="tab-notas">Notas Privadas (Cifradas)</button>
          <button class="tab-btn" data-tab="tab-dispositivo">Perfil y Dispositivo</button>
        </nav>

      <section id="tab-resumen" class="tab-view active">
        <div class="hero-banner">
          <div class="hero-header">
            <span class="hero-badge">Centro de Control Académico</span>
            <h1 class="hero-title">¡Hola! Tu resumen de hoy está listo</h1>
            <p class="hero-subtitle">Visualiza tus prioridades del día, gestiona entregas y monitorea tus horas de estudio en un solo lugar.</p>
          </div>

          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-label">
                <span>Racha Actual</span>
              </div>
              <div class="metric-value">6 días</div>
              <div class="metric-detail">¡Constancia diaria cumplida!</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Meta de Estudio Hoy</span>
                <span id="metric-study-ratio">1h 40m / 2h 30m</span>
              </div>
              <div class="metric-value" id="metric-study-percent">67%</div>
              <div class="progress-container">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" id="metric-progress-fill" style="width: 67%;"></div>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Clases de la Jornada</span>
              </div>
              <div class="metric-value">2 sesiones</div>
              <div class="metric-detail">Próxima: Cálculo II a las 08:00 AM</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">
                <span>Entregas Urgentes</span>
              </div>
              <div class="metric-value urgent">1 vence hoy</div>
              <div class="metric-detail">Ensayo de Ética (23:59)</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                Agenda del Día
              </h2>
              <span class="panel-badge">3 bloques</span>
            </div>

            <div class="agenda-list">
              <div class="agenda-item record-entry" data-record-key="clase-calculo" data-record-type="clase">
                <div class="agenda-time">08:00<br><small>10:00</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Cálculo II</div>
                  <div class="agenda-desc">Salón 304 • Integrales Múltiples • Prof. Méndez</div>
                  <button class="record-delete" type="button" data-delete-key="clase-calculo" aria-label="Eliminar clase de Cálculo II">Eliminar</button>
                </div>
              </div>

              <div class="agenda-item record-entry" data-record-key="clase-bd" data-record-type="clase">
                <div class="agenda-time">10:30<br><small>12:30</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Base de Datos</div>
                  <div class="agenda-desc">Laboratorio 3 • Modelado Relacional • Prof. Ruiz</div>
                  <button class="record-delete" type="button" data-delete-key="clase-bd" aria-label="Eliminar clase de Base de Datos">Eliminar</button>
                </div>
              </div>

              <div class="agenda-item study-block record-entry" data-record-key="bloque-estudio" data-record-type="bloque-estudio">
                <div class="agenda-time">14:00<br><small>15:40</small></div>
                <div class="agenda-info">
                  <div class="agenda-subject">Bloque de Estudio Personal</div>
                  <div class="agenda-desc">Biblioteca Central • Avance de proyectos y repaso</div>
                  <button class="record-delete" type="button" data-delete-key="bloque-estudio" aria-label="Eliminar bloque de estudio">Eliminar</button>
                </div>
              </div>
            </div>
          </div>

          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                Entregas Urgentes
              </h2>
              <span class="panel-badge danger">Atención requerida</span>
            </div>

            <div class="deliveries-list" id="urgent-deliveries-list">
              <div class="delivery-item urgent record-entry" id="item-etica" data-record-key="entrega-etica" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="etica" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Ensayo de Ética</div>
                    <div class="delivery-meta">Ética Profesional • Vence hoy (23:59)</div>
                  </div>
                </div>
                <span class="tag tag-urgent">Hoy</span>
                <button class="record-delete" type="button" data-delete-key="entrega-etica" aria-label="Eliminar Ensayo de Ética">Eliminar</button>
              </div>

              <div class="delivery-item warning record-entry" id="item-fisica" data-record-key="entrega-fisica" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="fisica" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Taller de Física — Cap. 4</div>
                    <div class="delivery-meta">Física II • Vence mañana (18:00)</div>
                  </div>
                </div>
                <span class="tag tag-warning">Mañana</span>
                <button class="record-delete" type="button" data-delete-key="entrega-fisica" aria-label="Eliminar Taller de Física">Eliminar</button>
              </div>

              <div class="delivery-item normal record-entry" id="item-bd" data-record-key="entrega-bd" data-record-type="entrega">
                <div class="delivery-left">
                  <input type="checkbox" class="delivery-check" data-id="bd" title="Marcar como lista" />
                  <div>
                    <div class="delivery-title">Proyecto de Base de Datos</div>
                    <div class="delivery-meta">Base de Datos • Vence en 4 días</div>
                  </div>
                </div>
                <span class="tag tag-info">En progreso</span>
                <button class="record-delete" type="button" data-delete-key="entrega-bd" aria-label="Eliminar Proyecto de Base de Datos">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tab-entregas" class="tab-view">
        <div class="kanban-grid">
          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-pending"></span>
                <span>Pendiente</span>
              </div>
              <span class="panel-badge">2</span>
            </div>
            <div class="kanban-cards" id="col-pending">
              <div class="kanban-card record-entry" data-record-key="entrega-etica" data-record-type="entrega">
                <h4>Ensayo de Ética</h4>
                <p>Ética Profesional • Vence hoy</p>
                <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
                <button class="record-delete" type="button" data-delete-key="entrega-etica" aria-label="Eliminar Ensayo de Ética">Eliminar</button>
              </div>
              <div class="kanban-card record-entry" data-record-key="entrega-fisica" data-record-type="entrega">
                <h4>Taller de Física — Cap. 4</h4>
                <p>Física II • 8 ejercicios impares</p>
                <button class="btn-move" onclick="alert('Entrega movida a En Progreso')">Mover a En Progreso</button>
                <button class="record-delete" type="button" data-delete-key="entrega-fisica" aria-label="Eliminar Taller de Física">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-progress"></span>
                <span>En progreso</span>
              </div>
              <span class="panel-badge">1</span>
            </div>
            <div class="kanban-cards" id="col-progress">
              <div class="kanban-card record-entry" data-record-key="entrega-bd" data-record-type="entrega">
                <h4>Proyecto de Base de Datos</h4>
                <p>Normalización y diagramas entidad-relación</p>
                <button class="btn-move" onclick="alert('Entrega movida a Entregado')">Mover a Entregado</button>
                <button class="record-delete" type="button" data-delete-key="entrega-bd" aria-label="Eliminar Proyecto de Base de Datos">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-title">
                <span class="kanban-dot dot-done"></span>
                <span>Entregado</span>
              </div>
              <span class="panel-badge">2</span>
            </div>
            <div class="kanban-cards" id="col-done">
              <div class="kanban-card delivered record-entry" data-record-key="entrega-quiz-ingles" data-record-type="entrega">
                <h4>Quiz de Inglés</h4>
                <p>Calificación: 4.8 / 5.0 • Aprobado</p>
                <button class="record-delete" type="button" data-delete-key="entrega-quiz-ingles" aria-label="Eliminar Quiz de Inglés">Eliminar</button>
              </div>
              <div class="kanban-card delivered record-entry" data-record-key="entrega-resena" data-record-type="entrega">
                <h4>Reseña de lectura</h4>
                <p>Comunicación Oral y Escrita</p>
                <button class="record-delete" type="button" data-delete-key="entrega-resena" aria-label="Eliminar Reseña de lectura">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tab-dispositivo" class="tab-view">
        ${e}
      </section>

      <section id="tab-pomodoro" class="tab-view">
        <div class="pomodoro-wrapper">
          <h3>Cronómetro y Modo Pomodoro</h3>
          <p class="pomo-subtitle">
            Sesiones de concentración asociadas directamente a tus asignaturas.
          </p>

          <div class="pomo-materia-row">
            <label for="pomo-materia-select">Asignatura:</label>
            <select id="pomo-materia-select" class="form-control inline">
              <option value="Cálculo II">Cálculo II</option>
              <option value="Base de Datos">Base de Datos</option>
              <option value="Física II">Física II</option>
              <option value="Ética Profesional">Ética Profesional</option>
            </select>
          </div>

          <div class="pomo-circle">
            <div class="pomo-time" id="pomo-display">25:00</div>
            <div class="pomo-subject" id="pomo-subject-label">Cálculo II</div>
          </div>

          <div class="pomo-controls">
            <button id="btn-pomo-toggle" class="btn-pomo btn-primary">Iniciar Enfoque</button>
            <button id="btn-pomo-reset" class="btn-pomo btn-secondary">Reiniciar</button>
            <button id="btn-pomo-break" class="btn-pomo btn-secondary">+5 min Descanso</button>
          </div>
        </div>
      </section>

      <section id="tab-notas" class="tab-view">
        <div class="crypto-wrapper">
          <h3>Notas Rápidas y Privadas</h3>
          <p class="subtitle">
            Bitácora de apuntes confidenciales cifrada localmente con AES-GCM 256 bits y almacenada en IndexedDB.
          </p>

          <div class="form-group">
            <label for="pass-key">Contraseña Maestra:</label>
            <input type="password" id="pass-key" class="form-control" placeholder="Introduce tu clave secreta para cifrar/descifrar" />
          </div>

          <div class="form-group">
            <label for="nota-materia">Asignatura:</label>
            <select id="nota-materia" class="form-control">
              <option value="Cálculo II">Cálculo II</option>
              <option value="Base de Datos">Base de Datos</option>
              <option value="Física II">Física II</option>
              <option value="General">Apunte General</option>
            </select>
          </div>

          <div class="form-group">
            <label for="nota-input">Contenido de la Nota:</label>
            <textarea id="nota-input" class="form-control" placeholder="Escribe aquí tu resumen, contraseña de laboratorio o apunte privado..."></textarea>
          </div>

          <div class="btn-group">
            <button id="btn-guardar" class="btn btn-save">Cifrar y Guardar en BD</button>
            <button id="btn-cargar" class="btn btn-load">Descifrar Última Nota</button>
          </div>

          <div id="crypto-output" class="crypto-result">
            Ingresa tu contraseña maestra y escribe una nota para probar la seguridad local.
          </div>
        </div>
      </section>

      </main>

      <footer class="app-footer">
        Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
      </footer>
    </div>
  `}function n(){`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/centro_mando_universitario_pwa/sw.js`).then(e=>console.log(`Workbox SW registrado:`,e.scope)).catch(e=>console.error(`Error al registrar SW:`,e))});function e(){let e=document.getElementById(`network-status`),t=document.getElementById(`offline-banner`);e&&(navigator.onLine?(e.className=`badge online`,e.innerHTML=`<span class="badge-dot"></span><span>En línea</span>`,t&&(t.hidden=!0)):(e.className=`badge offline`,e.innerHTML=`<span class="badge-dot"></span><span>Sin conexión (Offline)</span>`,t&&(t.hidden=!1)))}window.addEventListener(`online`,e),window.addEventListener(`offline`,e),e();let t,n=document.getElementById(`install-app`),r=document.getElementById(`ios-install-help`);n&&(n.hidden=!0),r&&(r.hidden=!0);let i=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform===`MacIntel`&&navigator.maxTouchPoints>1,a=/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);window.addEventListener(`beforeinstallprompt`,e=>{e.preventDefault(),t=e,n&&(n.hidden=!1),r&&(r.hidden=!0)}),n&&n.addEventListener(`click`,async()=>{if(!t)return;let e=t;t=void 0,n.hidden=!0,await e.prompt();let r=await e.userChoice;console.info(`Resultado de instalación:`,r.outcome)}),window.addEventListener(`appinstalled`,()=>{t=void 0,n&&(n.hidden=!0),r&&(r.hidden=!0)}),i&&a&&r&&(r.hidden=!1)}function r(){let e=document.querySelectorAll(`.tab-btn`),t=document.querySelectorAll(`.tab-view`);e.forEach(n=>{n.addEventListener(`click`,()=>{e.forEach(e=>e.classList.remove(`active`)),t.forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`);let r=n.getAttribute(`data-tab`);r&&document.getElementById(r)?.classList.add(`active`)})}),document.querySelectorAll(`.delivery-check`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target,n=t.closest(`.delivery-item`);n&&n.classList.toggle(`completed`,t.checked)})})}function i(){let e=1500,t=null,n=!1,r=document.getElementById(`pomo-display`),i=document.getElementById(`btn-pomo-toggle`),a=document.getElementById(`btn-pomo-reset`),o=document.getElementById(`btn-pomo-break`),s=document.getElementById(`pomo-materia-select`),c=document.getElementById(`pomo-subject-label`);s.addEventListener(`change`,()=>{c.textContent=s.value});function l(e){let t=Math.floor(e/60),n=e%60;return`${t.toString().padStart(2,`0`)}:${n.toString().padStart(2,`0`)}`}function u(){r.textContent=l(e)}i.addEventListener(`click`,()=>{n?(clearInterval(t),n=!1,i.textContent=`Reanudar Enfoque`,i.classList.remove(`btn-secondary`),i.classList.add(`btn-primary`)):(n=!0,i.textContent=`Pausar`,i.classList.remove(`btn-primary`),i.classList.add(`btn-secondary`),t=setInterval(()=>{e>0?(e--,u()):(clearInterval(t),n=!1,alert(`Sesión de estudio completada para ${s.value}.`),i.textContent=`Iniciar Enfoque`,i.classList.remove(`btn-secondary`),i.classList.add(`btn-primary`),e=1500,u())},1e3))}),a.addEventListener(`click`,()=>{clearInterval(t),n=!1,e=1500,u(),i.textContent=`Iniciar Enfoque`,i.classList.remove(`btn-secondary`),i.classList.add(`btn-primary`)}),o.addEventListener(`click`,()=>{clearInterval(t),n=!1,e=300,u(),i.textContent=`Iniciar Descanso`})}function a(){return new Promise((e,t)=>{if(!(`indexedDB`in window)||window.indexedDB===void 0||typeof window.indexedDB.open!=`function`){t(Error(`IndexedDB no está disponible en este navegador.`));return}let n=window.indexedDB.open(`centro-mando-db`,2);n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(`asignaturas`)||e.createObjectStore(`asignaturas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porNombre`,`nombre`,{unique:!0}),e.objectStoreNames.contains(`entregas`)||e.createObjectStore(`entregas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porEstado`,`estado`,{unique:!1}),e.objectStoreNames.contains(`sesionesEstudio`)||e.createObjectStore(`sesionesEstudio`,{keyPath:`id`,autoIncrement:!0}),e.objectStoreNames.contains(`notasPrivadas`)||e.createObjectStore(`notasPrivadas`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porMateria`,`materiaNombre`,{unique:!1}),e.objectStoreNames.contains(`registros`)||e.createObjectStore(`registros`,{keyPath:`id`,autoIncrement:!0}).createIndex(`porClave`,`clave`,{unique:!0}),e.objectStoreNames.contains(`evidencias`)||e.createObjectStore(`evidencias`,{keyPath:`id`,autoIncrement:!0})},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error),n.onblocked=()=>t(Error(`Cierra otras pestañas de la app para actualizar la base de datos.`))})}function o(e,t){return new Promise((n,r)=>{let i=e.transaction(`notasPrivadas`,`readwrite`).objectStore(`notasPrivadas`).add(t);i.onsuccess=()=>n(i.result),i.onerror=()=>r(i.error)})}function s(e){return new Promise((t,n)=>{let r=e.transaction(`notasPrivadas`,`readonly`).objectStore(`notasPrivadas`).getAll();r.onsuccess=()=>t(r.result),r.onerror=()=>n(r.error)})}function c(e,t){return new Promise((n,r)=>{let i=e.transaction(`registros`,`readwrite`),a=i.objectStore(`registros`),o=a.index(`porClave`).get(t.clave);o.onsuccess=()=>{if(o.result){n(o.result);return}let e=a.add(t);e.onsuccess=()=>n({...t,id:e.result}),e.onerror=()=>r(e.error)},o.onerror=()=>r(o.error),i.onerror=()=>r(i.error)})}function l(e,t){return new Promise((n,r)=>{let i=e.transaction(`registros`,`readwrite`),a=i.objectStore(`registros`),o=a.get(t),s;o.onsuccess=()=>{o.result&&(s=o.result,a.delete(t))},o.onerror=()=>r(o.error),i.oncomplete=()=>n(s),i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo eliminar el registro.`))})}function u(e,t){return new Promise((n,r)=>{let i=e.transaction(`registros`,`readwrite`),a=i.objectStore(`registros`),o=a.index(`porClave`).get(`parcial-proximo`);o.onsuccess=()=>{let e={id:o.result?.id,clave:`parcial-proximo`,tipo:`parcial`,titulo:`Próximo parcial`,fechaObjetivo:t},i=a.put(e);i.onsuccess=()=>{e.id=i.result,n(e)},i.onerror=()=>r(i.error)},o.onerror=()=>r(o.error),i.onerror=()=>r(i.error)})}function d(e,t){return new Promise((n,r)=>{let i=e.transaction(`registros`,`readwrite`),a=i.objectStore(`registros`),o=a.index(`porClave`).get(t.clave),s;o.onsuccess=()=>{if(o.result){s=o.result;return}let e={clave:t.clave,tipo:t.tipo,titulo:t.titulo,fechaObjetivo:t.fechaObjetivo},n=a.add(e);n.onsuccess=()=>{s={...e,id:n.result}},n.onerror=()=>r(n.error)},o.onerror=()=>r(o.error),i.oncomplete=()=>{s?n(s):r(Error(`No se pudo restaurar el registro.`))},i.onerror=()=>r(i.error),i.onabort=()=>r(i.error??Error(`No se pudo restaurar el registro.`))})}function f(e,t){return new Promise((n,r)=>{let i=e.transaction(`evidencias`,`readwrite`),a=i.objectStore(`evidencias`).add(t);a.onsuccess=()=>n(a.result),a.onerror=()=>r(a.error),i.onerror=()=>r(i.error)})}function p(e){return new Promise((t,n)=>{let r=e.transaction(`evidencias`,`readonly`).objectStore(`evidencias`).openCursor(null,`prev`);r.onsuccess=()=>{let e=r.result;if(!e){t(void 0);return}let n=e.value;n.propietarioTipo===`perfil`&&n.propietarioId===`estudiante`?t(n.imagen):e.continue()},r.onerror=()=>n(r.error)})}function m(){if(!(`crypto`in window)||window.crypto===void 0||!(`subtle`in window.crypto))throw Error(`Web Crypto no está disponible en este navegador.`);return window.crypto.subtle}async function h(e,t){let n=m(),r=await n.importKey(`raw`,new TextEncoder().encode(e),`PBKDF2`,!1,[`deriveKey`]);return n.deriveKey({name:`PBKDF2`,salt:t,iterations:1e5,hash:`SHA-256`},r,{name:`AES-GCM`,length:256},!1,[`encrypt`,`decrypt`])}async function g(e,t){let n=m();if(typeof window.crypto.getRandomValues!=`function`)throw Error(`La generación segura de números aleatorios no está disponible.`);let r=window.crypto.getRandomValues(new Uint8Array(12)),i=new TextEncoder().encode(t);return{cifrado:await n.encrypt({name:`AES-GCM`,iv:r},e,i),iv:r}}async function _(e,t){let n=await m().decrypt({name:`AES-GCM`,iv:t.iv},e,t.cifrado);return new TextDecoder().decode(n)}function v(){let e,t=document.getElementById(`crypto-output`),n=document.getElementById(`btn-guardar`),r=document.getElementById(`btn-cargar`);n.disabled=!0,r.disabled=!0,t.classList.add(`is-loading`),t.setAttribute(`aria-busy`,`true`),t.textContent=`Preparando el almacenamiento local…`;let i;`indexedDB`in window&&window.indexedDB!==void 0&&typeof window.indexedDB.open==`function`?i=a().then(i=>(e=i,console.log(`IndexedDB conectada correctamente para Centro de Mando`),t.classList.remove(`is-loading`),t.removeAttribute(`aria-busy`),t.textContent=`Almacenamiento local listo. Tus notas se guardan en este dispositivo.`,n.disabled=!1,r.disabled=!1,i)).catch(e=>{console.error(`Error al abrir la BD:`,e),t.classList.remove(`is-loading`),t.removeAttribute(`aria-busy`),t.classList.add(`state-error`),t.textContent=`No fue posible abrir el almacenamiento local. Las notas no están disponibles.`}):(t.classList.remove(`is-loading`),t.removeAttribute(`aria-busy`),t.classList.add(`state-error`),t.textContent=`Este navegador no admite IndexedDB; las notas privadas no están disponibles.`,i=Promise.resolve(void 0));let c=document.getElementById(`pass-key`),l=document.getElementById(`nota-input`),u=document.getElementById(`nota-materia`),d=t;return n.addEventListener(`click`,async()=>{let t=c.value,n=l.value,r=u.value;if(!t||!n){d.className=`crypto-result state-error`,d.innerHTML=`Escribe la contraseña y el contenido de la nota primero.`;return}if(!e){d.className=`crypto-result state-error`,d.textContent=`El almacenamiento local no está disponible en este navegador.`;return}try{let i=new Uint8Array(16);if(!(`crypto`in window)||window.crypto===void 0||typeof window.crypto.getRandomValues!=`function`)throw Error(`La generación segura de números aleatorios no está disponible.`);window.crypto.getRandomValues(i);let{cifrado:a,iv:s}=await g(await h(t,i),n),c={materiaNombre:r,titulo:`Nota de ${r}`,fechaCreacion:new Date().toISOString(),contenidoCifrado:a,iv:s,sal:i};await o(e,c),d.className=`crypto-result state-success`,d.replaceChildren();let u=document.createElement(`strong`);u.textContent=`Nota cifrada con AES-GCM 256 bits y almacenada con éxito.`;let f=document.createElement(`small`);f.textContent=`Materia: ${r} • ${new Date().toLocaleTimeString()}`,d.append(u,document.createElement(`br`),f),l.value=``}catch(e){console.error(e),d.className=`crypto-result state-error`,d.textContent=e instanceof Error?`Error al cifrar la nota: ${e.message}`:`Error al cifrar la nota.`}}),r.addEventListener(`click`,async()=>{let t=c.value;if(!t){d.className=`crypto-result state-error`,d.innerHTML=`Ingresa la contraseña maestra para descifrar.`;return}if(!e){d.className=`crypto-result state-error`,d.textContent=`El almacenamiento local no está disponible en este navegador.`;return}try{let n=await s(e);if(n.length===0){d.className=`crypto-result state-muted`,d.innerHTML=`No hay notas guardadas aún en la base de datos.`;return}let r=n[n.length-1];if(!r.sal){d.className=`crypto-result state-error`,d.textContent=`Esta nota se guardó con una versión anterior que no almacenaba la sal de cifrado; no es posible recuperarla. Las notas nuevas sí podrán descifrarse.`;return}let i=await _(await h(t,r.sal),{cifrado:r.contenidoCifrado,iv:r.iv});d.className=`crypto-result state-info`;let a=document.createElement(`div`);a.className=`decrypted-note`;let o=document.createElement(`div`);o.className=`decrypted-note-label`,o.textContent=`Nota Descifrada (${r.materiaNombre}):`;let c=document.createElement(`div`);c.className=`decrypted-note-body`,c.textContent=i;let l=document.createElement(`div`);l.className=`decrypted-note-date`,l.textContent=`Fecha: ${new Date(r.fechaCreacion).toLocaleString()}`,a.append(o,c,l),d.replaceChildren(a)}catch(e){console.error(e),d.className=`crypto-result state-error`,d.textContent=e instanceof DOMException&&e.name===`OperationError`?`Contraseña incorrecta o la nota está dañada; no se pudo descifrar.`:e instanceof Error?`No se pudo descifrar la nota: ${e.message}`:`Contraseña incorrecta o error al descifrar.`}}),i}async function y(e=`user`){if(!(`mediaDevices`in navigator)||navigator.mediaDevices===void 0||typeof navigator.mediaDevices.getUserMedia!=`function`)throw new DOMException(`La cámara no está disponible en este navegador.`,`NotSupportedError`);return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:e},width:{ideal:1280},height:{ideal:720}},audio:!1})}function b(e){e?.getTracks().forEach(e=>e.stop())}function x(e,t=640){return new Promise((n,r)=>{if(e.videoWidth<=0||e.videoHeight<=0){r(Error(`La cámara todavía no está lista para capturar una imagen.`));return}let i=Math.min(1,(Number.isFinite(t)?Math.max(1,t):640)/e.videoWidth),a=document.createElement(`canvas`);a.width=Math.round(e.videoWidth*i),a.height=Math.round(e.videoHeight*i);let o=a.getContext(`2d`);if(!o){r(Error(`No fue posible preparar la imagen capturada.`));return}o.drawImage(e,0,0,a.width,a.height),a.toBlob(e=>{e?n(e):r(Error(`El navegador no pudo codificar la fotografía.`))},`image/jpeg`,.8)})}function S(e){switch(e instanceof DOMException||e instanceof Error?e.name:``){case`NotAllowedError`:case`SecurityError`:return`No se permitió el acceso a la cámara. Autoriza el permiso en el navegador o elige una imagen del dispositivo.`;case`NotFoundError`:return`No se encontró una cámara disponible. Puedes elegir una imagen del dispositivo.`;case`NotReadableError`:return`La cámara está ocupada por otra aplicación o no se puede leer. Ciérrala e inténtalo de nuevo.`;case`OverconstrainedError`:return`La cámara no admite la configuración solicitada. Prueba con otra cámara o elige una imagen.`;case`TypeError`:case`NotSupportedError`:return`La cámara no está disponible en este contexto. Usa HTTPS o localhost, o elige una imagen.`;default:return`No fue posible abrir la cámara. Puedes elegir una imagen del dispositivo.`}}async function C(){if(!(`DeviceMotionEvent`in window)||window.DeviceMotionEvent===void 0)return`no-necesario`;let e=window.DeviceMotionEvent;if(typeof e.requestPermission!=`function`)return`no-necesario`;try{return await e.requestPermission()===`granted`?`granted`:`denied`}catch{return`denied`}}function w(e=1e3){return!(`DeviceMotionEvent`in window)||window.DeviceMotionEvent===void 0?Promise.resolve(!1):new Promise(t=>{let n=!1,r=e=>{n||(n=!0,window.removeEventListener(`devicemotion`,i),window.clearTimeout(a),t(e))},i=e=>{let t=e.accelerationIncludingGravity;t!=null&&t.x!==null&&t.y!==null&&t.z!==null&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isFinite(t.z)&&r(!0)},a=window.setTimeout(()=>r(!1),e);window.addEventListener(`devicemotion`,i)})}function T(e,{umbral:t=12,enfriamientoMs:n=1e3}={}){if(!(`DeviceMotionEvent`in window)||window.DeviceMotionEvent===void 0)return()=>void 0;let r=0,i=i=>{let a=i.accelerationIncludingGravity;if(!a||a.x===null||a.y===null||a.z===null||!Number.isFinite(a.x)||!Number.isFinite(a.y)||!Number.isFinite(a.z))return;let o=Math.hypot(a.x,a.y,a.z),s=Math.abs(o-9.81),c=Date.now();s>t&&c-r>=n&&(r=c,e(s))};return window.addEventListener(`devicemotion`,i),()=>window.removeEventListener(`devicemotion`,i)}function E(e){let t=document.getElementById(`btn-undo-delete`),n=document.getElementById(`shake-status`),r=document.getElementById(`camera-status`),i=document.getElementById(`dlg-camara`),a=document.getElementById(`camera-video`),o=document.getElementById(`profile-photo-preview`),s=document.getElementById(`profile-photo-file`),m,h=!1,g,_,v,E=new Map;function D(e){if(typeof URL.createObjectURL!=`function`||typeof URL.revokeObjectURL!=`function`){r.textContent=`La foto se guardó, pero este navegador no permite mostrar una vista previa.`;return}_&&URL.revokeObjectURL(_),_=URL.createObjectURL(e),o.src=_,o.hidden=!1}async function O(t){let n=await e;if(!n){r.textContent=`El almacenamiento local no está disponible. La foto no se pudo guardar.`;return}try{await f(n,{propietarioTipo:`perfil`,propietarioId:`estudiante`,creadoEn:new Date().toISOString(),imagen:t}),D(t),r.textContent=`Foto guardada localmente en el perfil de este dispositivo.`}catch(e){console.error(`Error al guardar la foto de perfil:`,e),r.textContent=`No se pudo guardar la foto. Comprueba el espacio disponible e inténtalo de nuevo.`}}function k(e,t=new Date){let n=e.getTime()-t.getTime();if(!Number.isFinite(n))return`La fecha del parcial no es válida.`;if(n<=0)return`El parcial ya llegó o pasó.`;let r=Math.floor(n/6e4);return`Faltan ${Math.floor(r/1440)} días, ${Math.floor(r%1440/60)} horas y ${r%60} minutos.`}function A(){let e=document.getElementById(`exam-date`),t=document.getElementById(`exam-countdown`);if(!e.value){t.textContent=`Selecciona la fecha del próximo parcial.`;return}t.textContent=k(new Date(e.value))}function j(e){e.forEach(({elemento:e,padre:t,siguiente:n})=>{n?.parentNode===t?t.insertBefore(e,n):t.append(e)})}function M(){document.querySelectorAll(`.kanban-col`).forEach(e=>{let t=e.querySelectorAll(`.kanban-cards > .record-entry`).length,n=e.querySelector(`.kanban-col-header .panel-badge`);n&&(n.textContent=String(t))});let e=document.querySelectorAll(`#tab-resumen .agenda-list > .record-entry`).length,t=document.querySelector(`#tab-resumen .dashboard-panel .panel-header .panel-badge`);t&&(t.textContent=`${e} bloques`)}async function N(r){let i=await e;if(!i||!m||h){n.textContent=`No hay elementos eliminados para restaurar.`;return}h=!0;try{let e=await d(i,m.registro);if(j(m.nodos),M(),E.set(e.clave,e),e.tipo===`parcial`&&e.fechaObjetivo){let t=document.getElementById(`exam-date`);t.value=e.fechaObjetivo,A()}m=void 0,t.disabled=!0,n.textContent=r===`sacudida`?`Elemento restaurado al detectar la sacudida.`:`Elemento restaurado.`}catch(e){console.error(`Error al deshacer la eliminación:`,e),n.textContent=`No se pudo restaurar el elemento. Inténtalo de nuevo con el botón.`}finally{h=!1}}async function P(e){let t=Array.from(document.querySelectorAll(`.record-entry`));for(let n of t){let t=n.dataset.recordKey,r=n.dataset.recordType;if(!t||!r||E.has(t))continue;let i=await c(e,{clave:t,tipo:r===`clase`||r===`entrega`||r===`parcial`||r===`bloque-estudio`?r:`entrega`,titulo:n.querySelector(`.agenda-subject, .delivery-title, h4, .panel-title`)?.textContent?.trim()??t});if(E.set(t,i),i.tipo===`parcial`&&i.fechaObjetivo){let e=document.getElementById(`exam-date`);e.value=i.fechaObjetivo,A();let t=document.querySelector(`[data-delete-key="parcial-proximo"]`);t&&(t.disabled=!1)}}}document.addEventListener(`click`,async r=>{if(h)return;let i=r.target;if(!(i instanceof Element))return;let a=i.closest(`[data-delete-key]`);if(!a||a.disabled)return;let o=a.dataset.deleteKey,s=o?E.get(o):void 0,c=await e;if(!c||!s?.id){n.textContent=`El registro no está listo para eliminarse. Comprueba el almacenamiento local.`;return}try{let e=await l(c,s.id);if(!e){n.textContent=`El registro ya no existe en el almacenamiento local.`;return}let r=Array.from(document.querySelectorAll(`.record-entry`)).filter(e=>e.dataset.recordKey===o).flatMap(e=>{let t=e.parentElement;return t?[{elemento:e,padre:t,siguiente:e.nextSibling}]:[]});r.forEach(({elemento:e})=>e.remove()),M(),E.delete(e.clave),m={registro:e,nodos:r},t.disabled=!1,n.textContent=`${e.titulo} eliminado. Puedes deshacerlo con el botón o agitando el dispositivo.`}catch(e){console.error(`Error al eliminar el registro:`,e),n.textContent=`No se pudo eliminar el registro del almacenamiento local.`}}),t.addEventListener(`click`,()=>{N(`botón`)}),document.getElementById(`btn-calculate-deadline`)?.addEventListener(`click`,async()=>{let t=document.getElementById(`exam-date`),n=document.getElementById(`exam-countdown`),r=new Date(t.value);if(!t.value||!Number.isFinite(r.getTime())){n.textContent=`Selecciona una fecha y hora válidas para el parcial.`;return}A();let i=await e;if(i)try{let e=await u(i,t.value);E.set(e.clave,e);let n=document.querySelector(`[data-delete-key="parcial-proximo"]`);n&&(n.disabled=!1)}catch(e){console.error(`Error al guardar la fecha del parcial:`,e),n.textContent+=` No se pudo guardar el parcial en el dispositivo.`}}),window.setInterval(A,6e4),document.getElementById(`btn-toggle-shake`)?.addEventListener(`click`,async e=>{let t=e.currentTarget;if(v){v(),v=void 0,t.textContent=`Activar agitar para deshacer`,n.textContent=`Gesto desactivado. Puedes deshacer con el botón visible.`;return}if(!(`DeviceMotionEvent`in window)){n.textContent=`Este dispositivo o navegador no expone sensores de movimiento. Usa el botón Deshacer.`;return}if(await C()===`denied`){n.textContent=`Permiso de movimiento denegado. Puedes deshacer con el botón visible.`;return}let r=await w();v=T(()=>{N(`sacudida`)}),t.textContent=`Desactivar agitar para deshacer`,n.textContent=r?`Agitar para deshacer está activo.`:`No se detectaron lecturas de movimiento. El botón Deshacer sigue disponible.`}),document.getElementById(`btn-open-camera`)?.addEventListener(`click`,async()=>{let e=()=>s.click();if(!window.isSecureContext){r.textContent=`Para usar la cámara abre la app mediante HTTPS o localhost. También puedes elegir una imagen.`;return}if(!(`mediaDevices`in navigator)||navigator.mediaDevices===void 0||typeof navigator.mediaDevices.getUserMedia!=`function`||typeof i.showModal!=`function`){r.textContent=`La cámara no está disponible aquí. Elige una imagen del dispositivo.`,e();return}try{g=await y(`user`),a.srcObject=g,i.showModal(),await a.play(),r.textContent=`Cámara activa. La foto se guardará solo cuando pulses Capturar.`}catch(e){i.open?i.close():(b(g),g=void 0,a.srcObject=null),r.textContent=S(e)}}),document.getElementById(`btn-choose-photo`)?.addEventListener(`click`,()=>s.click()),s.addEventListener(`change`,async()=>{let e=s.files?.[0];e&&e.type.startsWith(`image/`)?await O(e):e&&(r.textContent=`El archivo seleccionado no es una imagen.`),s.value=``}),document.getElementById(`btn-capture-photo`)?.addEventListener(`click`,async()=>{try{await O(await x(a)),i.close()}catch(e){console.error(`Error al capturar la foto:`,e),r.textContent=e instanceof Error?e.message:`No se pudo capturar la foto.`}});let F=()=>{b(g),g=void 0,a.pause(),a.srcObject=null};i.addEventListener(`close`,F),document.getElementById(`btn-cancel-camera`)?.addEventListener(`click`,()=>i.close()),e.then(async e=>{if(!e){n.textContent=`El almacenamiento local no está disponible; puedes seguir usando las funciones del resto de la app.`;return}try{await P(e);let t=await p(e);t&&D(t)}catch(e){console.error(`Error al inicializar las herramientas del dispositivo:`,e),n.textContent=`No fue posible cargar los datos locales de las herramientas.`}}),window.addEventListener(`pagehide`,()=>{F(),_&&=(URL.revokeObjectURL(_),void 0),v?.()})}t(),n(),r(),i(),E(v());