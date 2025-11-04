import { useState, useEffect } from 'react';

interface TerminalBadgeProps {
  isDarkMode: boolean;
  onTextLengthChange?: (length: number) => void;
}

export default function TerminalBadge({ isDarkMode, onTextLengthChange }: TerminalBadgeProps) {
  const fullText = '>open to work';
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'backspacing' | 'idle'>('idle');

  // Notify parent of current text length
  useEffect(() => {
    if (onTextLengthChange) {
      onTextLengthChange(displayText.length);
    }
  }, [displayText, onTextLengthChange]);

  useEffect(() => {
    let timeout: number;

    const randomDelay = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    if (phase === 'idle') {
      // Wait random time before starting to type
      timeout = setTimeout(() => {
        setPhase('typing');
      }, randomDelay(3000, 6000));
    } else if (phase === 'typing') {
      if (displayText.length < fullText.length) {
        // Type next character with random delay
        timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, randomDelay(50, 120));
      } else {
        // Finished typing, wait before backspacing
        timeout = setTimeout(() => {
          setPhase('waiting');
        }, randomDelay(2000, 3500));
      }
    } else if (phase === 'waiting') {
      // Wait before starting to backspace
      timeout = setTimeout(() => {
        setPhase('backspacing');
      }, randomDelay(1500, 2500));
    } else if (phase === 'backspacing') {
      if (displayText.length > 0) {
        // Backspace with random delay
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, randomDelay(30, 80));
      } else {
        // Finished backspacing, go back to idle
        timeout = setTimeout(() => {
          setPhase('idle');
        }, randomDelay(2000, 4000));
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, phase, fullText]);

  return (
    <div
      className="absolute left-full ml-2 whitespace-nowrap pointer-events-none select-none"
      style={{ top: '50%', transform: 'translateY(-50%)' }}
    >
      <span className={`terminal-text text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
        {displayText}
        <span className="terminal-cursor">|</span>
      </span>
    </div>
  );
}
