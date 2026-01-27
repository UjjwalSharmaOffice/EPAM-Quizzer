import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './ButtonColorful.css';

export function ButtonColorful({
  className = '',
  label = "Explore Components",
  subtitle,
  onClick,
  ...props
}) {
  return (
    <button
      className={`button-colorful ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Gradient background effect */}
      <div className="button-colorful-gradient" />

      {/* Content */}
      <div className="button-colorful-content">
        <div className="button-colorful-title">
          <span>{label}</span>
          <ArrowUpRight className="button-colorful-icon" size={16} />
        </div>
        {subtitle && (
          <span className="button-colorful-subtitle">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
}

export default ButtonColorful;
