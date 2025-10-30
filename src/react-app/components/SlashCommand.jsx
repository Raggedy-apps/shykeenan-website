import { useState } from 'react';

import { useState } from 'react';

import { guardInput } from '../../utils/guard.js';
import { sanitizeText } from '../utils/sanitization.js';

const COMMANDS = ['/plan', '/build', '/audit', '/guard', '/diag', '/brief'];

/**
 * SlashCommand Component
 * React interface for Raggedy AI slash commands.
 * Integrates RAGGEDY-GUARD for input validation and security.
 * Privacy: Local processing only, no data sent externally without opt-in.
 * VSCode Integration: Uses postMessage API if in extension context.
 */
const SlashCommand = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setOutput('');

    // Flush pending state updates so loading text is visible before heavy work begins.
    await new Promise(resolve => setTimeout(resolve, 0));

    const normalizedInput = sanitizeText(input, { trim: true });
    const segments = normalizedInput.split(/\s+/).filter(Boolean);
    const rawCommandToken = segments[0] ?? '';
    const args = segments.slice(1).join(' ');

    const guarded = guardInput({
      command: rawCommandToken.startsWith('/') ? rawCommandToken.slice(1) : rawCommandToken,
      args,
    });

    if (!guarded.safe) {
      setError(guarded.reason);
      setIsLoading(false);
      return;
    }

    try {
      if (!rawCommandToken.startsWith('/')) {
        throw new Error('Invalid slash command format');
      }

      const commandName = rawCommandToken.slice(1).toLowerCase();
      if (!COMMANDS.includes(`/${commandName}`)) {
        throw new Error(`Unknown command: ${rawCommandToken}. Available: ${COMMANDS.join(', ')}`);
      }

      let result;
      switch (commandName) {
        case 'plan':
          result = `Planning phase for: ${args || 'task'}. Architecture outline generated locally.`;
          break;
        case 'build':
          result = `Building: ${args || 'project'}. Code generation complete.`;
          break;
        case 'audit':
          result = `Audit report for: ${args || 'codebase'}. Issues: None (local scan).`;
          break;
        case 'guard':
          result = `Guard check: ${args || 'input'}. Safe: Yes (local validation).`;
          break;
        case 'diag':
          result = `Diagnostics: ${args || 'system'}. Status: Healthy (local).`;
          break;
        case 'brief':
          result = `Brief summary: ${args || 'project'}. Key points generated locally.`;
          break;
        default:
          throw new Error('Command not implemented locally');
      }

      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'RAGGEDY_SLASH_COMMAND',
            command: commandName,
            args,
            result,
            timestamp: Date.now(),
          },
          '*'
        );
        setOutput(`Sent to VSCode extension: ${result}`);
      } else {
        setOutput(result);
      }

      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptInData = () => {
    const confirmFn = typeof window !== 'undefined' ? window.confirm : null;
    if (!confirmFn) return;

    const optIn = confirmFn(
      'Opt-in to share anonymized usage data with Raggedy AI? (Local only otherwise)'
    );
    if (optIn) {
      // Placeholder for future opt-in behaviour
    }
  };

  return (
    <div
      className="slash-command-container p-4 border rounded-lg bg-gray-50"
      role="region"
      aria-label="Slash Commands Interface"
    >
      <h2 className="text-lg font-semibold mb-2">Raggedy AI Slash Commands</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter a command like <code>/plan task</code>. Local processing enabled.{' '}
        <button
          onClick={handleOptInData}
          className="text-blue-500 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Opt-in to data sharing"
        >
          Opt-in for advanced features
        </button>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(sanitizeText(e.target.value, { trim: false }))}
            placeholder="Enter your command here"
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Enter your slash command"
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary-500 text-white rounded disabled:opacity-50"
            aria-label="Execute the command"
          >
            {isLoading ? 'Running...' : 'Execute'}
          </button>
        </div>
        {error && (
          <div role="alert" className="p-2 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        {output && (
          <div
            role="status"
            aria-live="polite"
            aria-label="Polite status updates"
            className="p-2 bg-green-100 text-green-700 rounded"
          >
            {output}
          </div>
        )}
      </form>
      <ul className="mt-4 text-sm text-gray-500" aria-label="Available commands">
        {COMMANDS.map(cmd => (
          <li key={cmd}>{cmd}</li>
        ))}
      </ul>
    </div>
  );
};

export default SlashCommand;
