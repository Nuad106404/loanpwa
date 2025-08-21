import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, className = '' }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Scroll to top before navigation
    window.scrollTo(0, 0);
    // In a real application, we would use a router to navigate
  };

  return (
    <a 
      href={href} 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </a>
  );
};