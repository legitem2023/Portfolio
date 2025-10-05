import { useState, ReactNode } from 'react';

interface AdDropdownProps {
  content: ReactNode;
}

export default function AdDropdown({ content }: AdDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'sans-serif',
  };

  const buttonStyle: React.CSSProperties = {
    width: 'auto',
    padding: '2px',
    fontSize: '14px',
    textAlign: 'left',
    border: '1px solid #f1f1f1',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#f1f1f1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex:'9',
    color:'#707070'
  };

  const iconStyle: React.CSSProperties = {
    transition: 'transform 0.3s ease',
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#f1f1f1',
    padding: '5px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    zIndex:'0'
  };

  return (
    <div style={containerStyle}>
      <button style={buttonStyle} onClick={() => setIsOpen(!isOpen)}>
        Advertisement
        <span style={iconStyle}>▼</span>
      </button>
      {isOpen && <div style={contentStyle}>{content}</div>}
    </div>
  );
}
