import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function ContactContainer() {
  const { current } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Formulario enviado
    // Aquí iría la lógica de envío del formulario
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`flex gap-8 ${current.cardBg} rounded-3xl shadow-xl border ${current.cardBorder} p-8`}>
      {/* Imagen a la izquierda */}
      <div className="flex-1 max-w-lg">
        <img
          src={loginImage}
          alt="Contacto"
          className="rounded-2xl shadow-lg object-cover w-full h-[600px]"
        />
      </div>

      {/* Contenedor para el formulario de contacto */}
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <h1 className={`text-3xl font-bold text-center mb-2 ${current.textPrimary}`}>Contáctanos</h1>
        <p className={`${current.textSecondary} text-center mb-8`}>
          ¿Tienes alguna pregunta? Estamos aquí para ayudarte
        </p>

        <div className={`${current.formBg} rounded-2xl shadow-md border ${current.formBorder} p-6 w-full`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border ${current.inputBorder} rounded-lg ${current.inputBg} ${current.textSecondary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border ${current.inputBorder} rounded-lg ${current.inputBg} ${current.textSecondary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                placeholder="Correo electrónico"
                required
              />
            </div>
            <div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                className={`w-full px-3 py-2 text-sm border ${current.inputBorder} rounded-lg ${current.inputBg} ${current.textSecondary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none`}
                placeholder="Tu mensaje"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Enviar mensaje
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-4 text-xs ${current.textMuted} text-center`}>
            Responderemos a tu mensaje lo antes posible
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactContainer;
