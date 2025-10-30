
export default function TagSummary({ tagSummary, onSelect, activeTag }) {
  const tags = Object.entries(tagSummary ?? {}).sort((a, b) => b[1] - a[1]);
  if (!tags.length) return null;
  return (
    <div className="tag-summary">
      <h3>Filter by tag</h3>
      <div className="tag-summary-grid">
        <button
          type="button"
          className={!activeTag ? 'active' : ''}
          onClick={() => onSelect('')}
        >
          All
        </button>
        {tags.map(([tag, count]) => (
          <button
            type="button"
            key={tag}
            className={activeTag === tag ? 'active' : ''}
            onClick={() => onSelect(tag)}
          >
            {tag} <span>{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
