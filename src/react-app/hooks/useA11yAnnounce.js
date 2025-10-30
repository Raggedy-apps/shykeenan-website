import { useState, useEffect, useRef } from 'react';

export const useA11yAnnounce = () => {
  const [announcement, setAnnouncement] = useState('');
  const announcementRef = useRef(null);
  const timeoutRef = useRef(null);

  const announce = (message, politeness = 'polite') => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the announcement
    setAnnouncement(message);

    // Clear after announcement is read (screen readers typically need ~500ms)
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcementRef,
    announce,
    politeness: 'polite' // Default, can be overridden per call if needed
  };
};