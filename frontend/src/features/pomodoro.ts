export function inicializarPomodoro(): void {
  let pomoSeconds = 25 * 60;
  let pomoInterval: any = null;
  let isRunning = false;

  const pomoDisplay = document.getElementById('pomo-display')!;
  const pomoToggleBtn = document.getElementById('btn-pomo-toggle') as HTMLButtonElement;
  const pomoResetBtn = document.getElementById('btn-pomo-reset') as HTMLButtonElement;
  const pomoBreakBtn = document.getElementById('btn-pomo-break') as HTMLButtonElement;
  const pomoSubjectSelect = document.getElementById('pomo-materia-select') as HTMLSelectElement;
  const pomoSubjectLabel = document.getElementById('pomo-subject-label')!;

  pomoSubjectSelect.addEventListener('change', () => {
    pomoSubjectLabel.textContent = pomoSubjectSelect.value;
  });

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updatePomoDisplay() {
    pomoDisplay.textContent = formatTime(pomoSeconds);
  }

  pomoToggleBtn.addEventListener('click', () => {
    if (isRunning) {
      clearInterval(pomoInterval);
      isRunning = false;
      pomoToggleBtn.textContent = 'Reanudar Enfoque';
      pomoToggleBtn.classList.remove('btn-secondary');
      pomoToggleBtn.classList.add('btn-primary');
    } else {
      isRunning = true;
      pomoToggleBtn.textContent = 'Pausar';
      pomoToggleBtn.classList.remove('btn-primary');
      pomoToggleBtn.classList.add('btn-secondary');
      pomoInterval = setInterval(() => {
        if (pomoSeconds > 0) {
          pomoSeconds--;
          updatePomoDisplay();
        } else {
          clearInterval(pomoInterval);
          isRunning = false;
          alert(`Sesión de estudio completada para ${pomoSubjectSelect.value}.`);
          pomoToggleBtn.textContent = 'Iniciar Enfoque';
          pomoToggleBtn.classList.remove('btn-secondary');
          pomoToggleBtn.classList.add('btn-primary');
          pomoSeconds = 25 * 60;
          updatePomoDisplay();
        }
      }, 1000);
    }
  });

  pomoResetBtn.addEventListener('click', () => {
    clearInterval(pomoInterval);
    isRunning = false;
    pomoSeconds = 25 * 60;
    updatePomoDisplay();
    pomoToggleBtn.textContent = 'Iniciar Enfoque';
    pomoToggleBtn.classList.remove('btn-secondary');
    pomoToggleBtn.classList.add('btn-primary');
  });

  pomoBreakBtn.addEventListener('click', () => {
    clearInterval(pomoInterval);
    isRunning = false;
    pomoSeconds = 5 * 60;
    updatePomoDisplay();
    pomoToggleBtn.textContent = 'Iniciar Descanso';
  });
  }
