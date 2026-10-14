/**
 * DataModeSwitch — the builder's Manual / Query Based choice (2026-09-30).
 *
 * The old control was a pair of small outlined chips. It read as a filter, not as the switch
 * that replaces everything below it (Axes, Data Configuration, Conditions ↔ the SQL box).
 * Two replacements, both the user's picks, switchable from the builder's demo pill:
 *
 *   A · cards  — two option cards, icon + title + one line saying what you'll get. The
 *                chosen card is edged in --sel with a check.
 *   D · banner — the mode as a STATE: a tinted strip naming the mode you are in and what
 *                it means for the fields below, with one action to switch.
 *   pill       — the product's segmented track (`.pill-track`, the same control as the
 *                sidebar's Public / Private / Restricted), the track hugging its text.
 */
import { Icon } from '../ui/primitives';
import './DataModeSwitch.css';

export function DataModeSwitch({ modelValue = 'manual', variant = 'cards', subject = 'chart', onUpdateModelValue }: any) {
  const MODES = [
    { id: 'manual', icon: 'appearance', title: 'Manual', line: 'Pick fields and conditions, no SQL.',
      state: `Building this ${subject} from the fields and conditions below.`, tag: 'Manual mode' },
    { id: 'query', icon: 'code', title: 'Query based', line: 'Write the SQL that returns the data.',
      state: `This ${subject} runs the SQL you write below.`, tag: 'Query mode' },
  ];
  const cur = MODES.find((m) => m.id === modelValue) || MODES[0];
  const other = MODES.find((m) => m.id !== cur.id)!;
  const pick = (id: string) => onUpdateModelValue?.(id);

  /* A · option cards */
  if (variant === 'cards') return (
    <div className="dc-DataModeSwitch dm-cards" role="radiogroup" aria-label="Data source">
      {MODES.map((m) => (
        <button
          key={m.id} type="button" className={`dm-card ${m.id === cur.id ? 'on' : ''}`}
          role="radio" aria-checked={m.id === cur.id} onClick={() => pick(m.id)}
        >
          <span className="dm-ic"><Icon name={m.icon} size={16} /></span>
          <span className="dm-txt">
            <b>{m.title}</b>
            <span>{m.line}</span>
          </span>
          {m.id === cur.id && <Icon name="check-circle" size={16} className="dm-check" />}
        </button>
      ))}
    </div>
  );

  /* pill: the product's pill-track */
  if (variant === 'pill') return (
    <div className="dc-DataModeSwitch pill-track dm-seg" role="radiogroup" aria-label="Data source">
      {MODES.map((m) => (
        <button key={m.id} type="button" aria-pressed={m.id === cur.id} title={m.line} onClick={() => pick(m.id)}>
          <Icon name={m.icon} size={14} /> {m.title}
        </button>
      ))}
    </div>
  );

  /* D · mode banner */
  return (
    <div className={`dc-DataModeSwitch dm-banner is-${cur.id}`} role="status">
      <span className="dm-ic"><Icon name={cur.icon} size={16} /></span>
      <span className="dm-txt">
        <em>{cur.tag}</em>
        <span>{cur.state}</span>
      </span>
      <button type="button" className="btn btn-sm dm-switch" onClick={() => pick(other.id)}>
        Switch to {other.title} <Icon name="arrow-right" size={14} />
      </button>
    </div>
  );
}
