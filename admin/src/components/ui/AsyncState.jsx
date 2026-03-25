export const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="state-box state-box--loading">
      <div className="state-spinner" />
      <p>{message}</p>
    </div>
  );
};

export const ErrorState = ({ message = "Something went wrong." }) => {
  return (
    <div className="state-box state-box--error">
      <p>{message}</p>
    </div>
  );
};
