import { useTheme } from '../../contexts/ThemeContext';
import iconLogin from '../../assets/icon-login-new.svg';
import icon3 from '../../assets/icon3.png';
import LoginForm from './LoginForm';

function LoginContainer({ onClose }) {
  const { current } = useTheme();

  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#051C33] overflow-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#34B6D8]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1A71B8]/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row w-full h-full max-w-7xl mx-auto p-4 lg:p-12 gap-8 relative z-10">

        {/* Left Content - Messaging Ley Karin */}
        <div className="hidden lg:flex flex-col lg:w-3/5 justify-center relative px-12">
          {/* Decorative geometric elements */}
          <div className="absolute top-1/4 -left-10 w-24 h-24 border border-white/5 rounded-2xl rotate-12 backdrop-blur-sm -z-10 animate-[pulse_4s_ease-in-out_infinite]"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A71B8]/20 border border-[#34B6D8]/30 text-[#34B6D8] text-xs font-bold uppercase tracking-widest w-fit mb-8 shadow-[0_0_15px_rgba(52,182,216,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#34B6D8] animate-ping relative"><span className="absolute inset-0 rounded-full bg-[#34B6D8]"></span></span>
            Cumplimiento Ley Karin
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-[#E2F1FD] to-[#1A71B8] tracking-tight leading-[1.15] mb-6 drop-shadow-sm" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
            Plataforma Integral de Convivencia Laboral
          </h1>
          
          <p className="text-lg lg:text-xl text-white/70 max-w-xl leading-relaxed mb-12 font-medium">
            Garantizando espacios laborales seguros, de mutuo respeto y libres de violencia y acoso, conforme a la Ley 21.643.
          </p>

     
        </div>

        {/* Right Content - Login Form */}
        <div className="w-full lg:w-2/5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[420px] bg-[#0A3866]/40 backdrop-blur-2xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.6)] p-10 rounded-[32px] hover:shadow-[0_0_40px_rgba(26,113,184,0.3)] transition-all duration-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="flex justify-center mb-8 relative z-10">
               <img src={icon3} alt="Logo" className="h-20 w-20 drop-shadow-2xl brightness-110" />
            </div>
            
            <div className="mb-10 text-center relative z-10">
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">Bienvenido</h2>
              <p className="text-[#34B6D8] text-sm font-medium">Ingresa para acceder a tu plataforma.</p>
            </div>

            <div className="relative z-10">
               <LoginForm />
            </div>

            <div className="mt-10 text-center relative z-10 border-t border-white/10 pt-6">
              <p className="text-xs text-white/40 tracking-widest uppercase font-bold">© 2026 Convivencia Laboral</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginContainer;
