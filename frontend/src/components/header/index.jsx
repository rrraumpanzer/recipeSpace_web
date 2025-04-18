// components/header/index.jsx
import { useState, useRef, useEffect } from 'react';
import AuthModal from '../auth/AuthModal.jsx';
import './Header.css';

function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="site-title">recipeSpace</h1>
        <button 
          className="login-button"
          onClick={() => setIsModalOpen(true)}
        >
          Войти
        </button>
      </div>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
}

export default Header;