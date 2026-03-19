import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenido a Mis Expedientes',
    description: 'Esta es tu central de gestión de expedientes de convivencia. Como Encargado de Convivencia, aquí puedes crear, buscar, filtrar y gestionar todos los expedientes bajo tu responsabilidad. Este recorrido te mostrará las principales funcionalidades.',
    target: null,
    badge: 'Introducción',
  },
  {
    id: 'search',
    title: 'Buscador de Expedientes',
    description: 'Escribe aquí para encontrar expedientes de forma instantánea. Puedes buscar por título del expediente, tipo o por el nombre de las personas involucradas.',
    target: 'search-input',
    badge: 'Búsqueda',
  },
  {
    id: 'filters',
    title: 'Filtros Principales',
    description: 'Estos filtros te permiten organizar tu vista rápidamente. Ordena por fecha o título, filtra por estado del expediente (Abierto, Pendiente, Resuelto) o filtra por expedientes compartidos.',
    target: 'filters-group',
    badge: 'Filtros',
  },
  {
    id: 'more-filters',
    title: 'Filtros de Fecha',
    description: 'Haz clic en "Más filtros" para acceder a filtros adicionales por año y mes. Cuando un filtro está activo aparece un punto azul indicador.',
    target: 'more-filters-btn',
    badge: 'Filtros',
  },
  {
    id: 'new-case',
    title: 'Crear Nuevo Expediente',
    description: 'Haz clic aquí para registrar un nuevo expediente de forma rápida. Solo ingresa un título descriptivo y presiona Enter. Puedes completar todos los detalles después desde la vista del expediente.',
    target: 'new-case-btn',
    badge: 'Acción Principal',
  },
  {
    id: 'cases-grid',
    title: 'Cuadrícula de Expedientes',
    description: 'Aquí aparecen todas tus tarjetas de expedientes. Los expedientes con plazos de protocolo próximos o vencidos aparecen automáticamente al inicio para que no pierdas ningún seguimiento.',
    target: 'cases-grid',
    badge: 'Vista Principal',
  },
  {
    id: 'case-card',
    title: 'Tarjeta de Expediente',
    description: 'Cada tarjeta muestra la información clave: ID único (ej: C-001), título del expediente, número de personas involucradas y fecha de creación. Haz clic en la tarjeta para ver todos los detalles y el seguimiento del protocolo.',
    target: 'case-card-first',
    badge: 'Tarjeta',
  },
  {
    id: 'case-deadline',
    title: 'Semáforo de Plazos',
    description: 'Indica el estado del próximo paso del protocolo:\n• Verde: tiempo suficiente\n• Amarillo: plazo próximo (pocos días)\n• Rojo: plazo vencido, requiere atención urgente\n\nEl texto muestra qué paso del protocolo está pendiente y cuántos días quedan.',
    target: 'case-card-deadline',
    badge: 'Plazos',
    fallbackTarget: 'case-card-first',
  },
  {
    id: 'case-share',
    title: 'Compartir Expediente',
    description: 'Este botón te permite colaborar con otros Encargados de Convivencia o directivos en el mismo expediente. Los expedientes que compartiste muestran un indicador azul. Los que te compartieron muestran el nombre del propietario.',
    target: 'case-card-share-btn',
    badge: 'Colaboración',
    fallbackTarget: 'case-card-first',
  },
  {
    id: 'case-status',
    title: 'Estado del Expediente',
    description: 'Indica en qué etapa se encuentra el expediente:\n• Pendiente: en espera de acción\n• Abierto: en proceso de atención\n• Resuelto: expediente cerrado exitosamente\n• No Resuelto: cerrado sin resolución\n\nEl estado se actualiza desde la vista de detalles.',
    target: 'case-card-status',
    badge: 'Estados',
    fallbackTarget: 'case-card-first',
  },
  {
    id: 'finish',
    title: 'Todo listo',
    description: 'Ya conoces las principales funciones de Mis Expedientes. Puedes volver a este recorrido en cualquier momento haciendo clic en el boton de ayuda en la esquina inferior derecha.',
    target: null,
    badge: 'Completado',
  },
];

const PAD = 10;
const TOOLTIP_WIDTH = 460;

// Premium easing curves
const EASE_SMOOTH = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Apple-like super smooth
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy for elements
const DURATION_MOVE = '0.4s';
const DURATION_STEP = '0.3s';

function MyCasesTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [prevStep, setPrevStep] = useState(null);
  const [direction, setDirection] = useState('forward'); // 'forward' | 'backward'
  const [isTransitioning, setIsTransitioning] = useState(false);

  // SVG cutout rect (animated via CSS transition)
  const [cutout, setCutout] = useState({ x: -500, y: -500, w: 0, h: 0, visible: false });

  // Tooltip position
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
      // No highlight — shrink cutout off-screen or center it
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

    // Scroll gently, but don't delay the animation! 
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    // Instantly calculate and set the position so the CSS animation can begin traveling immediately
    const rect = el.getBoundingClientRect();
    setCutout({
      x: rect.left - PAD,
      y: rect.top - PAD,
      w: rect.width + PAD * 2,
      h: rect.height + PAD * 2,
      visible: true,
    });
    computeTooltipPosition(rect);

    // After the smooth scroll finishes (~350ms), recalculate once more to snap to the exact final coordinates
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
    }, 300); // DURATION_STEP in ms
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

  // Floating help button
  if (!isOpen) {
    return (
      <button
        onClick={() => { setCurrentStep(0); setPrevStep(null); setDirection('forward'); setIsOpen(true); }}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-[#1A71B8] hover:bg-[#155fa0] text-white rounded-full shadow-[0_4px_24px_rgba(26,113,184,0.55)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
        title="Como usar esta pagina"
        aria-label="Iniciar recorrido de ayuda"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute right-16 bg-[#0A3866] text-white text-sm font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl pointer-events-none select-none">
          Como funciona?
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

  // SVG mask: white = visible, black = hidden (inverted for mask)
  const maskTransition = `x ${DURATION_MOVE} ${EASE_SMOOTH}, y ${DURATION_MOVE} ${EASE_SMOOTH}, width ${DURATION_MOVE} ${EASE_SMOOTH}, height ${DURATION_MOVE} ${EASE_SMOOTH}, opacity ${DURATION_MOVE} ${EASE_SMOOTH}`;

  return (
    <>
      {/* CSS animations */}
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

      {/* SVG overlay with animated mask cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9990,
          pointerEvents: 'all',
          cursor: 'pointer',
        }}
        onClick={handleClose}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Full white = show overlay everywhere */}
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {/* Black cutout = hide overlay (reveal element underneath) */}
            <rect
              x={cutout.x}
              y={cutout.y}
              width={cutout.w}
              height={cutout.h}
              rx="14"
              ry="14"
              fill="black"
              style={{
                transition: maskTransition,
                opacity: cutout.visible ? 1 : 0,
              }}
            />
          </mask>
        </defs>
        <rect
          x="0" y="0"
          width={vw} height={vh}
          fill="rgba(5, 20, 45, 0.72)"
          mask="url(#tour-spotlight-mask)"
          style={{ backdropFilter: 'blur(1px)' }}
        />
      </svg>

      {/* Animated spotlight border */}
      {cutout.visible && (
        <div
          style={{
            position: 'fixed',
            top: cutout.y,
            left: cutout.x,
            width: cutout.w,
            height: cutout.h,
            borderRadius: 14,
            border: '2px solid rgba(52, 182, 216, 0.85)',
            animation: 'spotPulse 2.5s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 9992,
            transition: `top ${DURATION_MOVE} ${EASE_SMOOTH}, left ${DURATION_MOVE} ${EASE_SMOOTH}, width ${DURATION_MOVE} ${EASE_SMOOTH}, height ${DURATION_MOVE} ${EASE_SMOOTH}`,
          }}
        />
      )}

      {/* Tooltip card */}
      {isPositioned && (
        <div
          ref={tooltipRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            width: TOOLTIP_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
            fontFamily: "'Poppins', sans-serif",
            transition: `top ${DURATION_MOVE} ${EASE_SMOOTH}, left ${DURATION_MOVE} ${EASE_SMOOTH}`,
            animation: `tourTooltipAppear 0.4s ${EASE_SPRING} both`,
          }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_8px_32px_rgba(10,56,102,0.16),0_2px_8px_rgba(26,113,184,0.10),0_0_0_1px_rgba(226,232,240,0.8)] overflow-hidden">
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100/50">
              <div
                className="h-full bg-gradient-to-r from-[#1A71B8] to-[#34B6D8]"
                style={{
                  width: `${progress}%`,
                  transition: `width ${DURATION_STEP} ${EASE_SMOOTH}`,
                }}
              />
            </div>

            {/* Overlapping grid to allow cross-fade without height collapse jump */}
            <div className="grid">
              {/* Optional: Render previous step animating out */}
              {prevStep !== null && (
                <div
                  style={{
                    gridArea: '1 / 1',
                    animation: `${direction === 'forward' ? 'tourSlideOutForward' : 'tourSlideOutBackward'} ${DURATION_STEP} ${EASE_SMOOTH} both`,
                    pointerEvents: 'none',
                  }}
                >
                  <StepContent
                    step={TOUR_STEPS[prevStep]}
                    isFirstStep={prevStep === 0}
                    isLastStep={prevStep === TOUR_STEPS.length - 1}
                    currentStepIndex={prevStep}
                    onClose={handleClose}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onGoTo={goTo}
                    isTransitioning={isTransitioning}
                  />
                </div>
              )}

              {/* Render current step animating in */}
              <div
                style={{
                  gridArea: '1 / 1',
                  zIndex: 1,
                  animation: prevStep !== null
                    ? `${direction === 'forward' ? 'tourSlideInForward' : 'tourSlideInBackward'} ${DURATION_STEP} ${EASE_SMOOTH} both`
                    : 'none',
                }}
              >
                <StepContent
                  step={step}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  currentStepIndex={currentStep}
                  onClose={handleClose}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onGoTo={goTo}
                  isTransitioning={isTransitioning}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Extracted StepContent component for clean re-use during transition
function StepContent({ step, isFirstStep, isLastStep, currentStepIndex, onClose, onNext, onPrev, onGoTo, isTransitioning }) {
  return (
    <div className="p-7">
      {/* Badge + close */}
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

      {/* Title */}
      <h3 className="font-black text-[#0A3866] text-[22px] leading-tight mb-3">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-sm font-medium text-[#64748b] leading-relaxed mb-8 whitespace-pre-line">
        {step.description}
      </p>

      {/* Step dots + nav */}
      <div className="flex items-center justify-between">
        {/* Dots */}
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
                backgroundColor: i === currentStepIndex
                  ? '#1A71B8'
                  : i < currentStepIndex ? '#34B6D8' : '#e5e7eb',
                transition: `width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease`,
                border: 'none',
                padding: 0,
                cursor: isTransitioning ? 'default' : 'pointer',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
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

export default MyCasesTour;
