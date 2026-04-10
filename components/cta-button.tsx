import React from 'react';

interface ButtonProps {
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300"
    >
      <span className="relative z-10">PLAY NOW!</span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-600 rounded-xl opacity-0 transition-opacity duration-200 hover:opacity-100"></div>
    </button>
  );
};

export default Button;