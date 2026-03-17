const blurPresets = {
  softest: 'blur-sm',
  soft: 'blur',
  medium: 'blur-md',
  strong: 'blur-lg',
  stronger: 'blur-xl',
  strongest: 'blur-2xl',
  none: 'blur-none',
};

function GlowEffect({
  className = '',
  style = {},
  colors = ['#0A3866', '#1A71B8', '#34B6D8', '#1A71B8'],
  mode = 'rotate',
  blur = 'medium',
  scale = 1,
}) {
  const blurClass = typeof blur === 'number'
    ? `blur-[${blur}px]`
    : (blurPresets[blur] ?? 'blur-md');

  const cssVars = {
    '--glow-c1': colors[0] ?? '#0A3866',
    '--glow-c2': colors[1] ?? '#1A71B8',
    '--glow-c3': colors[2] ?? '#34B6D8',
    '--glow-c4': colors[3] ?? '#1A71B8',
    '--scale': scale,
  };

  const modeClass = mode === 'rotate' ? 'glow-rotate' : 'glow-flow';

  const flowStyle = mode === 'flowHorizontal' ? {
    background: `linear-gradient(to right, ${colors.join(', ')})`,
    backgroundSize: '200% 200%',
  } : {};

  return (
    <div
      style={{ ...cssVars, ...flowStyle, ...style }}
      className={`pointer-events-none absolute inset-0 h-full w-full scale-[var(--scale)] transform-gpu ${modeClass} ${blurClass} ${className}`}
    />
  );
}

export default GlowEffect;
