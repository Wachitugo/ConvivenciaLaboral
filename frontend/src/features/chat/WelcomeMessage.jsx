import { useState, useEffect } from 'react';

const FULL_TEXT = "Convivencia Laboral";
// "Convivencia " = 12 chars, "Laboral" = 7 chars
const CONVIVENCIA_LEN = 12;
const LABORAL_LETTERS = "Laboral".split('');
const LABORAL_COLORS = ['#60a5fa', '#34B6D8', '#60a5fa', '#93c5fd', '#60a5fa', '#34B6D8', '#60a5fa'];

function WelcomeMessage() {
  const [charCount, setCharCount] = useState(FULL_TEXT.length);
  const [isTyping, setIsTyping] = useState(false);
  const [jumpingIndex, setJumpingIndex] = useState(null);

  // Cada ~10s salta una letra aleatoria de "Laboral"
  useEffect(() => {
    const schedule = () => {
      const delay = 4000 + Math.random() * 2000; // entre 4 y 6 segundos
      return setTimeout(() => {
        const idx = Math.floor(Math.random() * LABORAL_LETTERS.length);
        setJumpingIndex(idx);
        // Quitamos el salto después de que termine la animación
        setTimeout(() => setJumpingIndex(null), 600);
        timerId = schedule();
      }, delay);
    };
    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, []);

  const triggerRewrite = () => {
    if (isTyping) return;
    setIsTyping(true);
    setCharCount(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= FULL_TEXT.length) {
        clearInterval(id);
        setIsTyping(false);
      }
    }, 55);
  };

  const convivenciaVisible = FULL_TEXT.slice(0, Math.min(charCount, CONVIVENCIA_LEN));
  const laboralVisible = charCount > CONVIVENCIA_LEN ? FULL_TEXT.slice(CONVIVENCIA_LEN, charCount) : '';

  return (
    <div className="flex flex-col w-full px-2  pb-28 relative">
      {/* Keyframes para el salto de letras */}
      <style>{`
        @keyframes letterJump {
          0%   { transform: translateY(0px)   scaleX(1)    scaleY(1);    }
          8%   { transform: translateY(4px)   scaleX(1.25) scaleY(0.75); }
          35%  { transform: translateY(-24px) scaleX(0.88) scaleY(1.18); }
          58%  { transform: translateY(-24px) scaleX(0.88) scaleY(1.18); }
          82%  { transform: translateY(4px)   scaleX(1.2)  scaleY(0.8);  }
          93%  { transform: translateY(-6px)  scaleX(0.97) scaleY(1.04); }
          100% { transform: translateY(0px)   scaleX(1)    scaleY(1);    }
        }
      `}</style>

      {/* Ambient glows de fondo */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#1A71B8]/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#34B6D8]/15 rounded-full blur-[60px] pointer-events-none" />

      {/* Label */}
      <div className="flex items-center gap-3 mb-6 relative">
        <span className="w-14 h-px bg-gradient-to-r from-[#34B6D8] to-[#60a5fa]"></span>
        <span className="text-sm font-black uppercase tracking-[0.3em] text-[#34B6D8]">
          Asistente Inteligente
        </span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34B6D8] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34B6D8]"></span>
        </span>
      </div>

      {/* Heading — clic para reescribir */}
      <h2
        onClick={triggerRewrite}
        title="Haz clic para animar"
        className="cursor-pointer select-none text-6xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-6 relative"
      >
        Potencia la{' '}
        <br />
        <span className="relative inline-block mt-1">

          {/* "Convivencia " con gradiente */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A71B8] via-[#34B6D8] to-[#1A71B8]">
            {convivenciaVisible}
          </span>

          {/* "Laboral" — letras estáticas durante el typing, salto aleatorio en reposo */}
          {!isTyping ? (
            <span>
              {LABORAL_LETTERS.map((letter, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    color: LABORAL_COLORS[i],
                    transformOrigin: 'bottom center',
                    animation: jumpingIndex === i ? 'letterJump 0.8s cubic-bezier(0.36,0.07,0.19,0.97) both' : 'none',
                  }}
                >
                  {letter}
                </span>
              ))}
            </span>
          ) : (
            <span>
              {laboralVisible.split('').map((letter, i) => (
                <span key={i} style={{ color: LABORAL_COLORS[i] }}>{letter}</span>
              ))}
            </span>
          )}

          {/* Cursor parpadeante mientras escribe */}
          {isTyping && (
            <span
              className="inline-block w-[3px] bg-[#34B6D8] ml-0.5 rounded-full align-middle animate-pulse"
              style={{ height: '0.82em' }}
            />
          )}

          {/* Underline glow */}
          <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-gradient-to-r from-[#1A71B8]/50 to-[#34B6D8]/50 blur-sm rounded-full" />
        </span>
      </h2>

      {/* Subtitulo */}
      <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-xl relative">
        Analiza el clima organizacional, gestiona conflictos y fortalece el bienestar corporativo con inteligencia artificial especializada.
      </p>

    </div>
  );
}

export default WelcomeMessage;
