/**
 * MDX Shortcodes for Shykeenan.uk
 * 
 * Reusable components for rich content in MDX files:
 * - Callout: Info, warning, success, error callouts
 * - Footnote: Accessible footnotes with back-references
 * - Figure: Images with captions and credits
 * - ContentWarning: Trigger warnings for sensitive content
 * - Quote: Styled blockquotes with attribution
 */

import { AlertTriangle, CheckCircle, Info, Shield, XCircle } from '@phosphor-icons/react';
import React from 'react';

/**
 * Callout Component
 * Usage: <Callout type="info">Important information</Callout>
 */
export function Callout({ type = 'info', children, title }) {
  const config = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div 
      className={`${bgColor} ${borderColor} ${textColor} border-l-4 p-4 my-4 rounded-r`}
      role="note"
      aria-label={`${type} callout`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} weight="duotone" />
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Footnote Component
 * Usage: <Footnote id="1">Additional context here</Footnote>
 */
export function Footnote({ id, children }) {
  return (
    <aside
      id={`footnote-${id}`}
      className="text-sm text-gray-600 dark:text-gray-400 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700"
      role="note"
      aria-label={`Footnote ${id}`}
    >
      <sup>
        <a href={`#footnote-ref-${id}`} className="text-accent hover:underline">
          [{id}]
        </a>
      </sup>{' '}
      {children}
    </aside>
  );
}

/**
 * Footnote Reference (inline)
 * Usage: text here<FootnoteRef id="1" />
 */
export function FootnoteRef({ id }) {
  return (
    <sup id={`footnote-ref-${id}`}>
      <a
        href={`#footnote-${id}`}
        className="text-accent hover:underline"
        aria-label={`Go to footnote ${id}`}
      >
        [{id}]
      </a>
    </sup>
  );
}

/**
 * Figure Component
 * Usage: <Figure src="/path/to/image.jpg" alt="Description" caption="Caption text" credit="Photo by..." />
 */
export function Figure({ src, alt, caption, credit, className = '' }) {
  return (
    <figure className={`my-8 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full rounded-lg shadow-lg"
        loading="lazy"
      />
      {(caption || credit) && (
        <figcaption className="mt-3 text-sm text-center text-gray-600 dark:text-gray-400">
          {caption && <p className="mb-1">{caption}</p>}
          {credit && <p className="text-xs italic">{credit}</p>}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Content Warning Component
 * Usage: <ContentWarning>This content discusses...</ContentWarning>
 */
export function ContentWarning({ children }) {
  const [isRevealed, setIsRevealed] = React.useState(false);

  if (isRevealed) {
    return (
      <div className="my-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" size={20} weight="duotone" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              Content Warning
            </p>
            <div className="text-sm text-orange-800 dark:text-orange-200">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 p-6 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg text-center">
      <Shield className="text-orange-600 dark:text-orange-400 mx-auto mb-3" size={32} weight="duotone" />
      <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
        Content Warning
      </p>
      <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
        This content may contain sensitive material.
      </p>
      <button
        onClick={() => setIsRevealed(true)}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        aria-label="Reveal content warning details"
      >
        Show Details
      </button>
    </div>
  );
}

/**
 * Quote Component
 * Usage: <Quote author="Shy Keenan" source="Broken, 2008">Quote text here</Quote>
 */
export function Quote({ author, source, children }) {
  return (
    <blockquote className="my-6 pl-6 border-l-4 border-accent italic">
      <div className="text-lg text-gray-700 dark:text-gray-300 mb-2">
        {children}
      </div>
      {(author || source) && (
        <footer className="text-sm text-gray-600 dark:text-gray-400 not-italic">
          {author && <cite className="font-semibold">{author}</cite>}
          {author && source && <span>, </span>}
          {source && <span>{source}</span>}
        </footer>
      )}
    </blockquote>
  );
}

/**
 * Timeline Event Component (for embedded timeline entries)
 * Usage: <TimelineEvent date="2003-01-01" category="advocacy">Event description</TimelineEvent>
 */
export function TimelineEvent({ date, category, children }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const categoryColors = {
    birth: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    childhood: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
    advocacy: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    publication: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    award: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    tragedy: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  };

  const colorClass = categoryColors[category] || categoryColors.advocacy;

  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <time className="text-sm font-semibold text-accent" dateTime={date}>
          {formatDate(date)}
        </time>
        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
          {category}
        </span>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}

/**
 * Book Card Component
 * Usage: <BookCard title="Broken" year="2008" cover="/covers/broken.jpg">Description</BookCard>
 */
export function BookCard({ title, year, publisher, isbn, cover, children }) {
  return (
    <div className="my-6 flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {cover && (
        <img
          src={cover}
          alt={`Cover of ${title}`}
          className="w-24 h-32 object-cover rounded shadow-sm flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {publisher && <span>{publisher}, </span>}
          {year}
        </p>
        {isbn && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
            ISBN: {isbn}
          </p>
        )}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Export all shortcodes
 */
export const mdxComponents = {
  Callout,
  Footnote,
  FootnoteRef,
  Figure,
  ContentWarning,
  Quote,
  TimelineEvent,
  BookCard,
};

export default mdxComponents;
