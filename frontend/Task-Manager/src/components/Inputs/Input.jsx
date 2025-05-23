import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';

const Input = ({ value, onChange, label, placeholder, type }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <label className="text-[13px] text-slate-800 mb-1 block">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:border-blue-600 transition">
        <input
          type={inputType}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-slate-800"
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <div className="ml-2">
            {showPassword ? (
              <FaRegEye
                size={20}
                className="text-black-600 cursor-pointer"
                onClick={toggleShowPassword}
              />
            ) : (
              <FaRegEyeSlash
                size={20}
                className="text-black-600 cursor-pointer"
                onClick={toggleShowPassword}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;