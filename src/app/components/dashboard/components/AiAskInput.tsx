/**
 * AiAskInput — the "Ask AI for insights, summaries, and actions…" bar from the
 * ServiceOps reference. Reused by the summary card footer, the bottom pill (B4)
 * and the prompt-bar entry (B6). Purely presentational: emits `submit` with the
 * typed text (or empty on a bare click, so a click can just open the panel).
 */
import { useState } from 'react';
import { Icon } from '../ui/primitives';
import './AiAskInput.css';

export function AiAskInput({ placeholder = 'Ask AI for insights, summaries, and actions…', size = 'md', autofocus = false, onSubmit, onOpen }: any) {
  const [text, setText] = useState('');
  const go = () => { onSubmit?.(text.trim()); setText(''); };
  return (
    <div className={`dc-AiAskInput ai-ask ${size}`} onClick={() => onOpen?.()}>
      <span className="aa-spark"><Icon name="sparkles" size={size === 'lg' ? 18 : 15} /></span>
      <input
        value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoFocus={autofocus}
        onKeyUp={(e) => { if (e.key === 'Enter') go(); }} onClick={(e) => e.stopPropagation()}
      />
      <button className={`aa-send ${text.trim() ? 'ready' : ''}`} title="Ask AI" onClick={(e) => { e.stopPropagation(); go(); }}>
        <Icon name="open-in" size={size === 'lg' ? 17 : 15} />
      </button>
    </div>
  );
}
