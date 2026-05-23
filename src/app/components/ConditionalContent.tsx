// components/ConditionalContent.tsx (Enhanced)
'use client';

import DOMPurify from 'dompurify';

interface ConditionalContentProps {
  content: string;
  className?: string;
  textClassName?: string;
  htmlClassName?: string;
  forceText?: boolean;  // Force plain text rendering
  forceHtml?: boolean;   // Force HTML rendering
  allowedTags?: string[];
}

export default function ConditionalContent({ 
  content, 
  className = '',
  textClassName = '',
  htmlClassName = '',
  forceText = false,
  forceHtml = false,
  allowedTags
}: ConditionalContentProps) {
  
  const containsHtmlTags = (str: string): boolean => {
    if (!str || forceText) return false;
    if (forceHtml) return true;
    
    const htmlRegex = /<([a-z][a-z0-9]*)\b[^>]*>.*?<\/\1>|<([a-z][a-z0-9]*)\b[^>]*\/?>/i;
    return htmlRegex.test(str);
  };

  const sanitizeHtml = (html: string): string => {
    const config = allowedTags ? { ALLOWED_TAGS: allowedTags } : {};
    return DOMPurify.sanitize(html, config);
  };

  const hasHtml = containsHtmlTags(content);
  const sanitizedHtml = hasHtml ? sanitizeHtml(content) : '';

  // If no content, return nothing
  if (!content) return null;

  return (
    <div className={className}>
      {hasHtml ? (
        <div 
          className={htmlClassName}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      ) : (
        <div className={textClassName}>
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
