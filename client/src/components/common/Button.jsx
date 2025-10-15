
const Button = ({ 
  children, 
  className = "", 
  type = "button", 
  disabled = false, 
  onClick, 
  ...props 
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition duration-200 
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"} 
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
