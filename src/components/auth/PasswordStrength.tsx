import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  const colors = ['bg-zinc-800', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              i <= strength ? colors[strength] : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${
          strength > 0 ? colors[strength].replace('bg-', 'text-') : 'text-zinc-500'
        }`}>
          {labels[strength]}
        </p>
        <div className="flex gap-2">
          <span className={`text-[8px] font-mono ${password.length >= 8 ? 'text-green-500' : 'text-zinc-600'}`}>8+ chars</span>
          <span className={`text-[8px] font-mono ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>ABC</span>
          <span className={`text-[8px] font-mono ${/[0-9]/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>123</span>
          <span className={`text-[8px] font-mono ${/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>#$&</span>
        </div>
      </div>
    </div>
  );
};
