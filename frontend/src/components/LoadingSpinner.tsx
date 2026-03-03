import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullPage = false }) => {
  const sizeClass = `loading-spinner-${size}`;
  
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className={`loading-spinner ${sizeClass}`}>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-text">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;