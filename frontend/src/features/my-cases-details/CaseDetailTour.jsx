import { useState, useEffect, useCallback, useRef } from 'react';
import { TOURS } from './CaseDetailTourData';

const PAD = 10;
const TOOLTIP_WIDTH = 460;

// Premium easing curves
const EASE_SMOOTH = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Apple-like super smooth
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy for elements
const DURATION_MOVE = '0.4s';
const DURATION_STEP = '0.3s';

function CaseDetailTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTourId, setCurrentTourId] = useState(null); // null means showing menu
  const [currentStep, setCurrentStep] = useState(0);
  const [prevStep, setPrevStep] = useState(null);
  const [direction, setDirection] = useState('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // SVG cutout rect (animated via CSS transition)
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const [cutout, setCutout] = useState({ x: vw / 2, y: vh / 2, w: 0, h: 0, visible: false });

  // Tooltip position
  const [tooltipPos, setTooltipPos] = useState({ top: vh / 2, left: vw / 2 });
  const [isPositioned, setIsPositioned] = useState(false);

  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  const activeSteps = currentTourId ? TOURS[currentTourId] : [];
  const step = activeSteps[currentStep];

  const computeTooltipPosition = useCallback((rect, isMenuMode = false) => {
    const TOOLTIP_H = tooltipRef.current?.offsetHeight || (isMenuMode ? 560 : 320);
    const ACTUAL_WIDTH = isMenuMode ? 360 : TOOLTIP_WIDTH;
    const currentVw = window.innerWidth;
    const currentVh = window.innerHeight;
    const GAP = 20;

    let top, left;

    if (!rect) {
      top = Math.max(20, currentVh / 2 - TOOLTIP_H / 2);
      left = currentVw / 2 - ACTUAL_WIDTH / 2;
    } else {
      // Intentar colocar el tooltip donde no tape el elemento destino, 
      // priorizando abajo, luego arriba, luego a la derecha.
      if (rect.bottom + PAD + GAP + TOOLTIP_H < currentVh) {
        top = rect.bottom + PAD + GAP;
        left = Math.max(16, Math.min(rect.left, currentVw - ACTUAL_WIDTH - 16));
      } else if (rect.top - PAD - GAP - TOOLTIP_H > 0) {
        top = rect.top - PAD - GAP - TOOLTIP_H;
        left = Math.max(16, Math.min(rect.left, currentVw - ACTUAL_WIDTH - 16));
      } else if (rect.right + PAD + GAP + ACTUAL_WIDTH < currentVw) {
        top = Math.max(16, Math.min(rect.top, currentVh - TOOLTIP_H - 16));
        left = rect.right + PAD + GAP;
      } else {
        // Fallback: Si el objetivo es enorme o no cabe, poner el tooltip abajo a la derecha
        // para afectar lo menos posible la visibilidad del panel central.
        top = Math.max(16, currentVh - TOOLTIP_H - 32);
        left = Math.max(16, currentVw - ACTUAL_WIDTH - 32);
      }
    }

    setTooltipPos({ top, left });
    setIsPositioned(true);
  }, []);

  const updateTarget = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isMenu = !currentTourId;

    if (isMenu || !step?.target) {
      // Menu mode or fallback: put cutout in center with 0 size
      setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
      computeTooltipPosition(null, isMenu);
      
      // Recalcular posición unos milisegundos después de renderizar para obtener la altura y ancho exactos del DOM
      timerRef.current = setTimeout(() => {
        computeTooltipPosition(null, isMenu);
      }, 50);
      return;
    }

    let el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el && step.fallbackTarget) {
      el = document.querySelector(`[data-tour="${step.fallbackTarget}"]`);
    }

    if (!el) {
      setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
      computeTooltipPosition(null, isMenu);
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
    computeTooltipPosition(rect, isMenu);

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
      computeTooltipPosition(finalRect, isMenu);
    }, 350);
  }, [currentTourId, step?.target, step?.fallbackTarget, computeTooltipPosition]);

  useEffect(() => {
    if (isOpen) updateTarget();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen, currentTourId, currentStep, updateTarget]);

  useEffect(() => {
    const onResize = () => { if (isOpen) updateTarget(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, updateTarget]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const selectTour = (tourId) => {
    if (tourId !== 'general') {
      // Programmatically click the tab to ensure it's open before starting the tour!
      const tabBtn = document.querySelector(`[data-tour="tab-${tourId}"]`);
      if (tabBtn) tabBtn.click();
    }
    
    // Give React a frame to mount the new tab content before calculating positions
    setTimeout(() => {
      setCurrentTourId(tourId);
      setCurrentStep(0);
      setDirection('forward');
    }, 150);
  };

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
    if (currentStep < activeSteps.length - 1) {
      goTo(currentStep + 1, 'forward');
    } else {
      // End of tour: return to menu
      setCurrentTourId(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) goTo(currentStep - 1, 'backward');
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentTourId(null);
    setCurrentStep(0);
    setPrevStep(null);
    setIsPositioned(false);
    setCutout({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, visible: false });
  };

  // Floating help button
  if (!isOpen) {
    return (
      <button
        onClick={() => { setCurrentTourId(null); setCurrentStep(0); setPrevStep(null); setDirection('forward'); setIsOpen(true); }}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-[#1A71B8] hover:bg-[#155fa0] text-white rounded-full shadow-[0_4px_24px_rgba(26,113,184,0.55)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
        title="Opciones de Ayuda"
        aria-label="Abrir opciones de recorrido"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute right-16 bg-[#0A3866] text-white text-sm font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl pointer-events-none select-none">
          ¿Necesitas ayuda?
        </span>
        <span className="absolute inset-0 rounded-full animate-ping bg-[#1A71B8]/30 pointer-events-none" />
      </button>
    );
  }

  const isLastStep = activeSteps && currentStep === activeSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = activeSteps && activeSteps.length > 0 ? ((currentStep + 1) / activeSteps.length) * 100 : 0;

  // SVG mask: white = visible, black = hidden (inverted for mask)
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

      {/* SVG overlay with animated mask cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9990,
          pointerEvents: step?.allowInteraction ? 'none' : 'all',
          cursor: step?.allowInteraction ? 'default' : 'pointer',
        }}
        onClick={step?.allowInteraction ? undefined : handleClose}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width={window.innerWidth} height={window.innerHeight} fill="white" />
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
          width={window.innerWidth} height={window.innerHeight}
          fill="rgba(5, 20, 45, 0.72)"
          mask="url(#tour-spotlight-mask)"
          style={{ backdropFilter: 'blur(3px)' }}
        />
      </svg>

      {/* Animated spotlight border */}
      {cutout.visible && currentTourId && (
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

      {/* Tooltip card or Menu */}
      {isPositioned && (
        <div
          ref={tooltipRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            width: currentTourId ? TOOLTIP_WIDTH : 360,
            maxWidth: 'calc(100vw - 32px)',
            fontFamily: "'Poppins', sans-serif",
            transition: `top ${DURATION_MOVE} ${EASE_SMOOTH}, left ${DURATION_MOVE} ${EASE_SMOOTH}, width ${DURATION_MOVE} ${EASE_SMOOTH}`,
            animation: `tourTooltipAppear 0.4s ${EASE_SPRING} both`,
          }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_8px_32px_rgba(10,56,102,0.16),0_2px_8px_rgba(26,113,184,0.10),0_0_0_1px_rgba(226,232,240,0.8)] overflow-hidden">
            
            {!currentTourId ? (
              // MENU MODE
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#0A3866] text-xl leading-snug">
                    ¿Qué te gustaría explorar?
                  </h3>
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1.5 rounded-xl text-[#64748b] hover:text-[#0A3866] hover:bg-[#f0f4f8] transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs font-medium text-[#64748b] leading-relaxed mb-5">
                  Selecciona una sección para iniciar un recorrido guiado en este expediente.
                </p>

                <div className="flex flex-col gap-2">
                  <MenuOption title="Recorrido General" onClick={() => selectTour('general')} />
                  <MenuOption title="Pestaña: Resumen IA" onClick={() => selectTour('resumen')} />
                  <MenuOption title="Pestaña: Protocolo" onClick={() => selectTour('protocolo')} />
                  <MenuOption title="Pestaña: Involucrados" onClick={() => selectTour('involucrados')} />
                  <MenuOption title="Pestaña: Cronología" onClick={() => selectTour('cronologia')} />
                  <MenuOption title="Pestaña: Documentos" onClick={() => selectTour('documentos')} />
                </div>
              </div>
            ) : (
              // TOUR MODE
              <>
                <div className="h-1.5 bg-gray-100/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#1A71B8] to-[#34B6D8]"
                    style={{
                      width: `${progress}%`,
                      transition: `width ${DURATION_STEP} ${EASE_SMOOTH}`,
                    }}
                  />
                </div>

                <div className="grid">
                  {prevStep !== null && (
                    <div
                      style={{
                        gridArea: '1 / 1',
                        animation: `${direction === 'forward' ? 'tourSlideOutForward' : 'tourSlideOutBackward'} ${DURATION_STEP} ${EASE_SMOOTH} both`,
                        pointerEvents: 'none',
                      }}
                    >
                      <StepContent
                        step={TOURS[currentTourId][prevStep]}
                        activeSteps={activeSteps}
                        isFirstStep={prevStep === 0}
                        isLastStep={prevStep === activeSteps.length - 1}
                        currentStepIndex={prevStep}
                        onClose={handleClose}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onGoTo={goTo}
                        isTransitioning={isTransitioning}
                        onBackToMenu={() => setCurrentTourId(null)}
                      />
                    </div>
                  )}

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
                      activeSteps={activeSteps}
                      isFirstStep={isFirstStep}
                      isLastStep={isLastStep}
                      currentStepIndex={currentStep}
                      onClose={handleClose}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      onGoTo={goTo}
                      isTransitioning={isTransitioning}
                      onBackToMenu={() => setCurrentTourId(null)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MenuOption({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-2xl bg-white/50 hover:bg-[#1A71B8]/10 border border-gray-100 hover:border-[#1A71B8]/30 transition-all flex items-center gap-3 group shadow-sm active:scale-[0.98]"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#1A71B8] transition-colors" />
      <span className="font-bold text-sm text-[#0f172a] group-hover:text-[#1A71B8] transition-colors">{title}</span>
      <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[#1A71B8] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function StepContent({ step, activeSteps, isFirstStep, isLastStep, currentStepIndex, onClose, onNext, onPrev, onGoTo, isTransitioning, onBackToMenu }) {
  
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToMenu}
            className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#64748b] hover:text-[#0A3866] transition-all"
            title="Volver al menú de ayuda"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A71B8] bg-[#1A71B8]/10 px-3 py-1.5 rounded-full inline-block">
            {step?.badge}
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-xl text-[#64748b] hover:text-[#0A3866] hover:bg-[#f0f4f8] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h3 className="font-black text-[#0A3866] text-[22px] leading-tight mb-3">
        {step?.title}
      </h3>

      <p className="text-sm font-medium text-[#64748b] leading-relaxed mb-8 whitespace-pre-line">
        {step?.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {activeSteps.map((_, i) => (
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

        <div className="flex items-center gap-2 w-full justify-end">
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
            {isLastStep ? 'Menú Principal' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaseDetailTour;
