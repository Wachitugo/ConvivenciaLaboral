import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Tablero de Control',
    description: 'Este es tu panel principal de análisis y seguimiento. Aquí encontrarás métricas clave, gráficos de actividad y un resumen actualizado de todo lo que ocurre en el sistema de convivencia laboral.',
    target: null,
    badge: 'Introducción',
  },
  {
    id: 'filters',
    title: 'Filtros de Período',
    description: 'Filtra todos los datos del tablero por año y mes. Al cambiar el período, todos los gráficos y tarjetas se actualizan automáticamente para reflejar la información del intervalo seleccionado.',
    target: 'dashboard-filters',
    badge: 'Filtros',
  },
  {
    id: 'stats',
    title: 'Indicadores Clave (KPIs)',
    description: 'Las tarjetas superiores muestran el resumen más importante de un vistazo: total de expedientes, entrevistas realizadas, casos resueltos y otros indicadores de gestión. Son el pulso rápido del sistema.',
    target: 'dashboard-stats',
    badge: 'Métricas',
  },
  {
    id: 'recent-cases',
    title: 'Expedientes Próximos a Vencer',
    description: 'Lista los expedientes cuyo plazo de protocolo está por vencer o ya venció. Están ordenados por urgencia para que puedas actuar primero en los casos más críticos.',
    target: 'dashboard-recent-cases',
    badge: 'Alertas',
  },
  {
    id: 'status-chart',
    title: 'Distribución por Estado',
    description: 'Muestra cómo se distribuyen los expedientes según su estado actual: Abiertos, Pendientes, Resueltos y No Resueltos. Te permite ver de un vistazo si hay acumulación en algún estado específico.',
    target: 'dashboard-status-chart',
    badge: 'Gráfico',
  },
  {
    id: 'demographics',
    title: 'Demografía de Entrevistas',
    description: 'Presenta el desglose de las entrevistas realizadas por género y área de trabajo. Útil para identificar patrones y grupos con mayor incidencia de situaciones de convivencia.',
    target: 'dashboard-demographics',
    badge: 'Gráfico',
  },
  {
    id: 'interview-count',
    title: 'Conteo de Entrevistas',
    description: 'Visualiza la cantidad de entrevistas realizadas agrupadas por área o cargo. Permite identificar qué sectores tienen mayor actividad dentro del proceso de gestión de convivencia.',
    target: 'dashboard-interview-count',
    badge: 'Gráfico',
  },
  {
    id: 'interview-assignment',
    title: 'Asignación de Entrevistas',
    description: 'Muestra cómo están distribuidas las entrevistas entre los distintos encargados o unidades. Ayuda a detectar desequilibrios en la carga de trabajo y asegurar una gestión equitativa.',
    target: 'dashboard-interview-assignment',
    badge: 'Gráfico',
  },
  {
    id: 'daily-activity',
    title: 'Actividad Diaria',
    description: 'Gráfico de barras que muestra la cantidad de acciones registradas por día en el período seleccionado. Útil para detectar días de alta carga o períodos sin actividad.',
    target: 'dashboard-daily-activity',
    badge: 'Gráfico',
  },
  {
    id: 'monthly-cases',
    title: 'Evolución Mensual',
    description: 'Muestra la tendencia de apertura de expedientes mes a mes. Permite identificar estacionalidades, picos de incidentes y comparar la evolución del año en curso con períodos anteriores.',
    target: 'dashboard-monthly-cases',
    badge: 'Gráfico',
  },
  {
    id: 'shared-cases',
    title: 'Expedientes Compartidos',
    description: 'Indica qué proporción de expedientes han sido compartidos con otros encargados o directivos para su revisión colaborativa. Refleja el nivel de trabajo en equipo en la gestión de casos.',
    target: 'dashboard-shared-cases',
    badge: 'Gráfico',
  },
  {
    id: 'finish',
    title: 'Todo listo',
    description: 'Ya conoces el Tablero de Control. Puedes volver a este recorrido en cualquier momento haciendo clic en el botón de ayuda en la esquina inferior derecha.',
    target: null,
    badge: 'Completado',
  },
];

const PAD = 10;
const TOOLTIP_WIDTH = 460;

const EASE_SMOOTH = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const DURATION_MOVE = '0.4s';
const DURATION_STEP = '0.3s';

function DashboardTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [prevStep, setPrevStep] = useState(null);
  const [direction, setDirection] = useState('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [cutout, setCutout] = useState({ x: -500, y: -500, w: 0, h: 0, visible: false });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  const step = TOUR_STEPS[currentStep];

  const computeTooltipPosition = useCallback((rect) => {
    const TOOLTIP_H = tooltipRef.current?.offsetHeight || 280;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 20;

    let top, left;

    if (!rect) {
      top = vh / 2 - TOOLTIP_H / 2;
      left = vw / 2 - TOOLTIP_WIDTH / 2;
    } else {
      if (rect.bottom + PAD + GAP + TOOLTIP_H < vh) {
        top = rect.bottom + PAD + GAP;
        left = Math.max(16, Math.min(rect.left, vw - TOOLTIP_WIDTH - 16));
      } else if (rect.top - PAD - GAP - TOOLTIP_H > 0) {
        top = rect.top - PAD - GAP - TOOLTIP_H;
        left = Math.max(16, Math.min(rect.left, vw - TOOLTIP_WIDTH - 16));
      } else if (rect.right + PAD + GAP + TOOLTIP_WIDTH < vw) {
        top = Math.max(16, Math.min(rect.top, vh - TOOLTIP_H - 16));
        left = rect.right + PAD + GAP;
      } else {
        top = Math.max(16, Math.min(rect.top, vh - TOOLTIP_H - 16));
        left = Math.max(16, rect.left - TOOLTIP_WIDTH - PAD - GAP);
      }
    }

    setTooltipPos({ top, left });
    setIsPositioned(true);
  }, []);

  const updateTarget = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!step?.target) {
      setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
      computeTooltipPosition(null);
      return;
    }

    let el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el && step.fallbackTarget) {
      el = document.querySelector(`[data-tour="${step.fallbackTarget}"]`);
    }

    if (!el) {
      setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
      computeTooltipPosition(null);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = el.getBoundingClientRect();
    setCutout({
      x: rect.left - PAD,
      y: rect.top - PAD,
      w: rect.width + PAD * 2,
      h: rect.height + PAD * 2,
      visible: true,
    });
    computeTooltipPosition(rect);

    timerRef.current = setTimeout(() => {
      const finalRect = el.getBoundingClientRect();
      setCutout({
        x: finalRect.left - PAD,
        y: finalRect.top - PAD,
        w: finalRect.width + PAD * 2,
        h: finalRect.height + PAD * 2,
        visible: true,
      });
      computeTooltipPosition(finalRect);
    }, 350);
  }, [step?.target, step?.fallbackTarget, computeTooltipPosition]);

  useEffect(() => {
    if (isOpen) updateTarget();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen, currentStep, updateTarget]);

  useEffect(() => {
    const onResize = () => { if (isOpen) updateTarget(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, updateTarget]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const goTo = (index, dir) => {
    if (isTransitioning || index === currentStep) return;
    setDirection(dir);
    setPrevStep(currentStep);
    setIsTransitioning(true);
    setCurrentStep(index);

    setTimeout(() => {
      setPrevStep(null);
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      goTo(currentStep + 1, 'forward');
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) goTo(currentStep - 1, 'backward');
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    setPrevStep(null);
    setIsPositioned(false);
    setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setCurrentStep(0); setPrevStep(null); setDirection('forward'); setIsOpen(true); }}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-[#1A71B8] hover:bg-[#155fa0] text-white rounded-full shadow-[0_4px_24px_rgba(26,113,184,0.55)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
        title="Cómo usar esta página"
        aria-label="Iniciar recorrido de ayuda"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute right-16 bg-[#0A3866] text-white text-sm font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl pointer-events-none select-none">
          ¿Cómo funciona?
        </span>
        <span className="absolute inset-0 rounded-full animate-ping bg-[#1A71B8]/30 pointer-events-none" />
      </button>
    );
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const maskTransition = `x ${DURATION_MOVE} ${EASE_SMOOTH}, y ${DURATION_MOVE} ${EASE_SMOOTH}, width ${DURATION_MOVE} ${EASE_SMOOTH}, height ${DURATION_MOVE} ${EASE_SMOOTH}, opacity ${DURATION_MOVE} ${EASE_SMOOTH}`;

  return (
    <>
      <style>{`
        @keyframes tourSlideInForward {
          0% { opacity: 0; transform: translateX(20px) scale(0.98); filter: blur(4px); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
        }
        @keyframes tourSlideOutForward {
          0% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: translateX(-20px) scale(0.98); filter: blur(4px); }
        }
        @keyframes tourSlideInBackward {
          0% { opacity: 0; transform: translateX(-20px) scale(0.98); filter: blur(4px); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
        }
        @keyframes tourSlideOutBackward {
          0% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: translateX(20px) scale(0.98); filter: blur(4px); }
        }
        @keyframes tourTooltipAppear {
          0% { opacity: 0; transform: scale(0.96) translateY(10px); filter: blur(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
        @keyframes spotPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(52,182,216,0.15), 0 0 24px rgba(52,182,216,0.1); border-color: rgba(52, 182, 216, 0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(52,182,216,0.25), 0 0 40px rgba(52,182,216,0.25); border-color: rgba(52, 182, 216, 0.9); }
        }
      `}</style>

      <svg
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9990, pointerEvents: 'all', cursor: 'pointer' }}
        onClick={handleClose}
      >
        <defs>
          <mask id="dashboard-tour-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            <rect
              x={cutout.x} y={cutout.y} width={cutout.w} height={cutout.h}
              rx="14" ry="14" fill="black"
              style={{ transition: maskTransition, opacity: cutout.visible ? 1 : 0 }}
            />
          </mask>
        </defs>
        <rect x="0" y="0" width={vw} height={vh} fill="rgba(5, 20, 45, 0.72)" mask="url(#dashboard-tour-mask)" />
      </svg>

      {cutout.visible && (
        <div
          style={{
            position: 'fixed',
            top: cutout.y, left: cutout.x, width: cutout.w, height: cutout.h,
            borderRadius: 14,
            border: '2px solid rgba(52, 182, 216, 0.85)',
            animation: 'spotPulse 2.5s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 9992,
            transition: `top ${DURATION_MOVE} ${EASE_SMOOTH}, left ${DURATION_MOVE} ${EASE_SMOOTH}, width ${DURATION_MOVE} ${EASE_SMOOTH}, height ${DURATION_MOVE} ${EASE_SMOOTH}`,
          }}
        />
      )}

      {isPositioned && (
        <div
          ref={tooltipRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipPos.top, left: tooltipPos.left,
            zIndex: 9999,
            width: TOOLTIP_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
            fontFamily: "'Poppins', sans-serif",
            transition: `top ${DURATION_MOVE} ${EASE_SMOOTH}, left ${DURATION_MOVE} ${EASE_SMOOTH}`,
            animation: `tourTooltipAppear 0.4s ${EASE_SPRING} both`,
          }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_8px_32px_rgba(10,56,102,0.16),0_2px_8px_rgba(26,113,184,0.10),0_0_0_1px_rgba(226,232,240,0.8)] overflow-hidden">
            <div className="h-1.5 bg-gray-100/50">
              <div
                className="h-full bg-gradient-to-r from-[#1A71B8] to-[#34B6D8]"
                style={{ width: `${progress}%`, transition: `width ${DURATION_STEP} ${EASE_SMOOTH}` }}
              />
            </div>

            <div className="grid">
              {prevStep !== null && (
                <div style={{ gridArea: '1 / 1', animation: `${direction === 'forward' ? 'tourSlideOutForward' : 'tourSlideOutBackward'} ${DURATION_STEP} ${EASE_SMOOTH} both`, pointerEvents: 'none' }}>
                  <StepContent
                    step={TOUR_STEPS[prevStep]} isFirstStep={prevStep === 0} isLastStep={prevStep === TOUR_STEPS.length - 1}
                    currentStepIndex={prevStep} onClose={handleClose} onNext={handleNext} onPrev={handlePrev} onGoTo={goTo} isTransitioning={isTransitioning}
                  />
                </div>
              )}
              <div style={{ gridArea: '1 / 1', zIndex: 1, animation: prevStep !== null ? `${direction === 'forward' ? 'tourSlideInForward' : 'tourSlideInBackward'} ${DURATION_STEP} ${EASE_SMOOTH} both` : 'none' }}>
                <StepContent
                  step={step} isFirstStep={isFirstStep} isLastStep={isLastStep}
                  currentStepIndex={currentStep} onClose={handleClose} onNext={handleNext} onPrev={handlePrev} onGoTo={goTo} isTransitioning={isTransitioning}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StepContent({ step, isFirstStep, isLastStep, currentStepIndex, onClose, onNext, onPrev, onGoTo, isTransitioning }) {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#1A71B8] bg-[#1A71B8]/10 px-3 py-1.5 rounded-full inline-block">
          {step.badge}
        </span>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-xl text-[#64748b] hover:text-[#0A3866] hover:bg-[#f0f4f8] transition-all"
          aria-label="Cerrar tour"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h3 className="font-black text-[#0A3866] text-[22px] leading-tight mb-3">{step.title}</h3>
      <p className="text-sm font-medium text-[#64748b] leading-relaxed mb-8 whitespace-pre-line">{step.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i, i > currentStepIndex ? 'forward' : 'backward')}
              disabled={isTransitioning}
              aria-label={`Ir al paso ${i + 1}`}
              style={{
                width: i === currentStepIndex ? 24 : 7,
                height: 7,
                borderRadius: 9999,
                backgroundColor: i === currentStepIndex ? '#1A71B8' : i < currentStepIndex ? '#34B6D8' : '#e5e7eb',
                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease',
                border: 'none', padding: 0,
                cursor: isTransitioning ? 'default' : 'pointer',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              disabled={isTransitioning}
              className="px-4 py-2 text-sm text-[#64748b] hover:text-[#0A3866] hover:bg-[#f0f4f8] rounded-xl font-bold transition-all duration-200"
            >
              Anterior
            </button>
          )}
          <button
            onClick={onNext}
            disabled={isTransitioning}
            className="flex items-center justify-center gap-2 bg-[#0A3866] hover:bg-[#1A71B8] text-white font-bold text-sm py-2 px-5 rounded-xl transition-all shadow-md shadow-[#1A71B8]/20 active:scale-[0.98]"
          >
            {isLastStep ? 'Entendido' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardTour;
