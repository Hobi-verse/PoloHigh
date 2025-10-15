const Divider = ({ className = "" }) => (
  <hr
    className={`my-4 border-t border-white/10 opacity-70 ${className}`.trim()}
    aria-hidden="true"
  />
);

export default Divider;
