
import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label: React.FC<LabelProps> = ({ children, ...props }) => {
  return (
    <label
      {...props}
      className="block text-sm font-medium text-slate-300 mb-2"
    >
      {children}
    </label>
  );
};

export default Label;
