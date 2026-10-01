import React, { useState } from 'react';
import { X, Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('leticiagabbriella@gmail.com');
  const [password, setPassword] = useState('estetica123');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, informe a senha de acesso.');
      return;
    }
    // Accept demo password or any configured credentials
    onLoginSuccess();
    onClose();
  };

  const handleQuickDemoLogin = () => {
    onLoginSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              <span>Área Restrita</span>
            </div>
            <h2 className="font-serif text-2xl font-medium text-stone-900 mt-0.5">
              Login da Esteticista
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-stone-600 leading-relaxed">
            Acesse o painel exclusivo para gerenciar serviços, definir horários da agenda e enviar o link de agendamento para suas pacientes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-stone-700">
                  Senha de Acesso
                </label>
                <span className="text-[10px] text-stone-400">Padrão: estetica123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>
            </div>

            {error && (
              <div className="p-2 text-xs text-red-700 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-[11px] text-stone-400 uppercase">ou</span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F3EFE9] text-stone-800 font-medium text-xs rounded-lg border border-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>Entrar como Dra. Letícia Gabriella (Demonstração)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
