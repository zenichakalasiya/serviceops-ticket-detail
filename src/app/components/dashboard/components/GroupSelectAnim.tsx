/**
 * GroupSelectAnim — a small looping "video" that demonstrates the grouping gesture:
 * a marquee box is dragged across two widget tiles, they highlight as selected, and
 * a "New group" container forms around them. Pure CSS keyframes, no assets. Used in
 * the tour to teach a gesture that is otherwise discoverable-only.
 *
 * Reduced-motion viewers see the grouped end-state, held still.
 */
import './GroupSelectAnim.css';

export function GroupSelectAnim() {
  return (
    <div className="dc-GroupSelectAnim gsa" aria-hidden="true">
      <div className="tile t1" /><div className="tile t2" /><div className="tile t3" />
      <div className="marquee" />
      <div className="group"><span className="glabel">New group</span></div>
      <div className="cursor" />
    </div>
  );
}
