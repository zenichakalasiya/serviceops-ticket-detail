/* Support Portal builder — the shared style packs P1–P8 (spec §5).
 *
 * Every widget's Styling tab is assembled from these. They are authored ONCE and take a node id;
 * they are never re-authored per widget. A widget declares which packs it has (and, for P3, which
 * typography roles it actually owns) and gets the fields for free.
 *
 * Every field is an InheritRow driven by the resolver, so each one states whether this layer set it,
 * which ancestor it is coming from otherwise, and offers Revert. That is the §8.2 contract: the
 * parent value is always visible, and reverting deletes the local key rather than copying the
 * parent's — a copy looks identical today and drifts tomorrow.
 */

import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { ROLE_LABEL, hasOwn, hasOwnRole, modeKey, portalColorMode, resolve, resolveIn, resolveType, revertKeys, revertRole } from './portalStyleResolver';
import type { NodeStyle, PortalStyles, RoleType, TypeRole } from './portalPageModel';
import {
  ALIGN_OPTIONS, Badge, Chips, Field, InheritRow, Note, NumberField,
  SelectField, SliderRow, Segmented, TextField, ToggleRow, UploadZone,
} from './PortalControls';
import { ColorField } from './PortalColorPicker';
import { BorderRow, RadiusRow, ShadowBlock, SizeRow } from './PortalBoxControls';

/* ── the binder every pack field goes through ────────────────────────────── */

export interface PackProps {
  styles: PortalStyles;
  id: string;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  /** Replaces the whole style object for a node — how Revert deletes a key. */
  replaceStyle: (id: string, next: NodeStyle) => void;
  /** P3 renders only the roles the widget actually has. */
  roles?: TypeRole[];
}

/* A colour field, mode-aware. ⚠️ Its own helper rather than a flag on `field` because a colour is
   the ONE kind of style value that has two: padding, radius and font size are the same number in a
   light portal and a dark one, and giving them tabs would ask a question with one answer. So the
   pair lives where colours are built, and every other field stays exactly as it was. */
function useColorField({ styles, id, setStyle, replaceStyle }: PackProps) {
  return function colorField(key: keyof NodeStyle, label: string, help?: string) {
    const r = resolve(styles, id, key);
    const light = String(resolveIn(styles, id, key, 'light').value ?? '#FFFFFF');
    const dark = String(resolveIn(styles, id, key, 'dark').value ?? light);
    return (
      <InheritRow
        key={String(key)}
        label={label}
        state={r.source}
        from={r.fromName}
        help={help}
        /* ⚠️ Revert drops BOTH halves. Clearing only the light one would leave a dark override with
           nothing under it — a value the admin cannot see in the mode they are working in and
           cannot reach from a control that now reads as inherited. */
        onRevert={() => replaceStyle(id, revertKeys(styles[id], [key, `dark:${String(key)}` as keyof NodeStyle]))}
      >
        <ColorField
          value={String(r.value ?? '#FFFFFF')}
          onChange={(v) => setStyle(id, { [key]: v } as Partial<NodeStyle>)}
          modes={{
            mode: portalColorMode(),
            light,
            dark,
            onChange: (m, v) => setStyle(id, { [modeKey(m, String(key))]: v } as Partial<NodeStyle>),
          }}
        />
      </InheritRow>
    );
  };
}

/** One resolved, revertable field. This is the only way a pack touches style. */
function useField({ styles, id, setStyle, replaceStyle }: PackProps) {
  return function field<K extends keyof NodeStyle>(key: K, label: string, render: (
    value: NonNullable<NodeStyle[K]>,
    set: (v: NodeStyle[K]) => void,
  ) => ReactNode, help?: string | { bare?: boolean }) {
    const bare = typeof help === 'object' && help.bare === true;
    const helpText = typeof help === 'string' ? help : undefined;
    const r = resolve(styles, id, key);
    const set = (v: NodeStyle[K]) => setStyle(id, { [key]: v } as Partial<NodeStyle>);
    /* A control that draws its own label row (a switch) is rendered bare — wrapping it in a
       labelled row printed the label twice. */
    if (bare) return <Fragment key={String(key)}>{render(r.value, set)}</Fragment>;
    return (
      <InheritRow
        key={String(key)}
        label={label}
        state={r.source}
        from={r.fromName}
        help={helpText}
        onRevert={() => replaceStyle(id, revertKeys(styles[id], [key]))}
      >
        {render(r.value, set)}
      </InheritRow>
    );
  };
}

/** A pack: its title, the keys it owns (for the Overridden badge) and its body. */
export interface StylePack {
  id: string;
  title: string;
  keys: (keyof NodeStyle)[];
  Render: (p: PackProps) => ReactNode;
}

const badgeFor = (p: PackProps, keys: (keyof NodeStyle)[]) =>
  hasOwn(p.styles, p.id, keys) ? <Badge>Overridden</Badge> : undefined;

/* ⚠️ No badge. An "Overridden" tag on a section head told you a value differs from the theme,
   which is what the section is FOR — it fired on almost every group and stopped carrying meaning. */
export const packBadge = () => undefined;

/* ── P1 — Container ──────────────────────────────────────────────────────── */

const P1_KEYS: (keyof NodeStyle)[] = [
  'bgFill', 'bg', 'bgImage', 'bgOverlay', 'bgScope', 'borderMode', 'borderColor', 'radius', 'padding', 'elevation',
];

export const P1_Container: StylePack = {
  id: 'P1', title: 'Style', keys: P1_KEYS,
  Render: (p) => {
    const field = useField(p);
    const colorField = useColorField(p);
    const fill = resolve(p.styles, p.id, 'bgFill').value;
    const g = (k) => resolve(p.styles, p.id, k).value;
    const set = (k, v) => p.setStyle(p.id, { [k]: v });
    return (
      <>
        {field('bgFill', 'Fill', (v, setV) => (
          <Segmented
            value={v}
            onChange={setV}
            /* ⚠️ No Image fill. A background photograph behind a widget is not a fill, it is artwork —
               it needs a crop, a focal point and a contrast guard to stay readable, none of which a
               three-way segmented control can offer. Where a picture genuinely belongs (an action
               card's icon slot, the banner) it has its own field that does all three. */
            options={[{ value: 'none', label: 'None' }, { value: 'color', label: 'Colour' }]}
          />
        ))}
        {fill === 'color' && colorField('bg', 'Background colour')}
        {fill === 'image' && field('bgImage', 'Background image', (v, setV) => <UploadZone value={v} onChange={setV} />)}
        {fill === 'image' && field('bgOverlay', 'Overlay', (v, setV) => (
          <SliderRow value={v} onChange={setV} min={0} max={80} unit="%" />
        ), 'Darkens the artwork so text stays readable over it.')}
        {/* The same border, radius and shadow controls every element gets — built once, not
            re-cut per pack. */}
        <BorderRow
          width={Number(g('borderWidth') ?? 0)}
          color={String(g('borderColor') ?? '#E5E7EB')}
          sides={g('borderSides')}
          onSides={(x) => set('borderSides', x)}
          onWidth={(x) => set('borderWidth', x)}
          onColor={(x) => set('borderColor', x)}
          stroke={String(g('borderStyle') ?? 'solid')}
          onStroke={(x) => set('borderStyle', x)}
          /* The same pair the background colour gets — one rule for every colour in this pack. */
          colorModes={{
            mode: portalColorMode(),
            light: String(resolveIn(p.styles, p.id, 'borderColor', 'light').value ?? '#E5E7EB'),
            dark: String(resolveIn(p.styles, p.id, 'borderColor', 'dark').value ?? resolveIn(p.styles, p.id, 'borderColor', 'light').value ?? '#E5E7EB'),
            onChange: (m, v) => set(modeKey(m, 'borderColor') as keyof NodeStyle, v),
          }}
        />
        <RadiusRow
          value={Number(g('radius') ?? 8)}
          onChange={(x) => set('radius', x)}
          corners={g('corners')}
          onCorners={(c) => set('corners', c)}
        />
        {/* ⚠️ No ShadowBlock. It was four controls — on, colour, inner/outer, position — for an
            effect almost nothing on a support portal wants, sitting in the same accordion as the
            fill and the border that decide how a block actually reads. Removing it takes the whole
            group from five questions to two. The keys stay on `NodeStyle`, so anything already
            carrying a shadow keeps rendering it; there is simply no longer a control to add one. */}
      </>
    );
  },
};

/* ── P2 — Size & position ────────────────────────────────────────────────── */

const P2_KEYS: (keyof NodeStyle)[] = ['widthPct', 'height', 'align', 'spaceTop', 'spaceBottom'];

export const P2_Size: StylePack = {
  id: 'P2', title: 'Size', keys: P2_KEYS,
  Render: (p) => {
    const st = p.styles[p.id] ?? {};
    return (
      <SizeRow
        width={Number(st.widthPct ?? 100)}
        height={st.height === undefined ? null : Number(st.height)}
        keep={st.keepRatio !== false}
        onChange={(x) => p.setStyle(p.id, {
          ...(x.width !== undefined ? { widthPct: x.width } : {}),
          ...(x.height !== undefined ? { height: x.height } : {}),
          ...(x.keep !== undefined ? { keepRatio: x.keep } : {}),
        })}
      />
    );
  },
};

/* ── P3 — Typography, exposed per ROLE ───────────────────────────────────── */

const WEIGHTS = [
  { value: 'regular' as const, label: 'Regular' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'bold' as const, label: 'Bold' },
];
const LINE_HEIGHTS = [
  { value: 'tight' as const, label: 'Tight' },
  { value: 'normal' as const, label: 'Normal' },
  { value: 'relaxed' as const, label: 'Relaxed' },
];

/** Every role the page theme offers a face for. `inherit` is first and is the default. */
export const THEME_FONTS = ['inherit', 'Inter', 'Roboto', 'Source Sans 3', 'Merriweather', 'IBM Plex Mono'];

function RoleEditor({ p, role }: { p: PackProps; role: TypeRole }) {
  const [open, setOpen] = useState(false);
  const own = hasOwnRole(p.styles, p.id, role);

  const rf = <K extends keyof RoleType>(key: K, label: string, render: (
    value: NonNullable<RoleType[K]>, set: (v: RoleType[K]) => void,
  ) => ReactNode, help?: string) => {
    const r = resolveType(p.styles, p.id, role, key);
    const set = (v: RoleType[K]) => {
      const cur = p.styles[p.id]?.type ?? {};
      p.setStyle(p.id, { type: { ...cur, [role]: { ...cur[role], [key]: v } } });
    };
    return (
      <InheritRow
        label={label}
        state={p.styles[p.id]?.type?.[role]?.[key] !== undefined ? 'own' : r.source === 'theme' ? 'theme' : 'inherited'}
        from={r.fromName}
        help={help}
        onRevert={() => {
          const cur = p.styles[p.id]?.type ?? {};
          const next = { ...cur[role] };
          delete next[key];
          p.setStyle(p.id, { type: { ...cur, [role]: next } });
        }}
      >{render(r.value as NonNullable<RoleType[K]>, set)}</InheritRow>
    );
  };

  return (
    <div className="mt-3 rounded border border-[#F0F2F5] first:mt-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <span className="text-[12px] font-medium text-[#364658]">{ROLE_LABEL[role]}</span>
        {own && <Badge>Overridden</Badge>}
        <span className="ml-auto text-[11px] text-[#9CA3AF]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="border-t border-[#F0F2F5] px-3 pb-3">
          {/* ⚠️ Typeface defaults to Inherit and must STAY there. A per-widget face is an escape
              hatch for one line, not a way to build a page in six fonts — portal-wide type is a
              Theme decision, which is where the helper points. */}
          {rf('font', 'Typeface', (v, set) => (
            <SelectField
              value={v as string}
              onChange={set}
              options={THEME_FONTS.map((f) => ({ value: f, label: f === 'inherit' ? 'Inherit from theme' : f }))}
            />
          ), 'Set the portal-wide typeface in Theme. This is for the one line that has to differ.')}
          {rf('size', 'Size', (v, set) => <SliderRow value={v as number} onChange={set} min={80} max={200} step={5} unit="%" />)}
          {rf('weight', 'Weight', (v, set) => <Segmented value={v as string} onChange={set} options={WEIGHTS} />)}
          {rf('color', 'Colour', (v, set) => <ColorField value={v as string} onChange={set} />)}
          {rf('align', 'Alignment', (v, set) => <Segmented value={v as string} onChange={set} options={ALIGN_OPTIONS} />)}
          {rf('lineHeight', 'Line height', (v, set) => <Segmented value={v as string} onChange={set} options={LINE_HEIGHTS} />)}
          {rf('maxLines', 'Max lines', (v, set) => <NumberField value={v as number} onChange={set} min={0} max={10} />, '0 = no clamp.')}
          <button
            onClick={() => p.replaceStyle(p.id, revertRole(p.styles[p.id], role))}
            className="mt-3 text-[12px] font-medium text-[#3D8BD0] hover:underline"
          >Revert this role to inherited</button>
        </div>
      )}
    </div>
  );
}

export const P3_Typography: StylePack = {
  id: 'P3', title: 'Typography', keys: ['type'],
  Render: (p) => (
    <>
      {(p.roles ?? ['title', 'body']).map((r) => <RoleEditor key={r} p={p} role={r} />)}
    </>
  ),
};

/* ── P4 — List & grid arrangement ────────────────────────────────────────── */

const P4_KEYS: (keyof NodeStyle)[] = ['arrangement', 'columns', 'gap', 'density', 'dividers', 'itemAlign', 'equalHeight'];

export const P4_Arrangement: StylePack = {
  id: 'P4', title: 'Arrangement', keys: P4_KEYS,
  Render: (p) => {
    const field = useField(p);
    /* ⚠️ Two controls only. List-vs-grid, column count, row density, item alignment and
       equal-height all arranged CONTENT these widgets fetch rather than own, so they went with the
       rest of the row controls. Spacing between items and a rule between them are the two things
       that are genuinely the admin's to set here. */
    return (
      <>
        {field('gap', 'Gap between items', (v, set) => <SliderRow value={v as number} onChange={set} min={0} max={32} />)}
        {/* A toggle, not an On/Off segmented pair — it is one binary thing, and the segmented
            version spent a full row saying what a switch says in its own width. */}
        {field('dividers', 'Divider between items', (v, set) => (
          <ToggleRow label="Divider between items" on={v !== false} onChange={set} />
        ), { bare: true })}
      </>
    );
  },
};

/* ── P5 — Media ──────────────────────────────────────────────────────────── */

const P5_KEYS: (keyof NodeStyle)[] = ['ratio', 'fit', 'focal', 'shape', 'mediaRadius', 'mediaOverlay', 'captionPos'];

const FOCAL = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'];

export const P5_Media: StylePack = {
  id: 'P5', title: 'Media', keys: P5_KEYS,
  Render: (p) => {
    const field = useField(p);
    return (
      <>
        {field('ratio', 'Aspect ratio', (v, set) => (
          <SelectField value={v as string} onChange={set} options={['Original', '1:1', '4:3', '16:9', '21:9']} />
        ))}
        {field('fit', 'Fit', (v, set) => (
          <Segmented value={v} onChange={set} options={[{ value: 'cover' as const, label: 'Cover' }, { value: 'contain' as const, label: 'Contain' }]} />
        ))}
        {field('focal', 'Focal point', (v, set) => (
          <div className="grid w-[84px] grid-cols-3 gap-1">
            {FOCAL.map((f) => (
              <button
                key={f}
                onClick={() => set(f)}
                title={f}
                className={`size-6 rounded border transition-colors ${
                  v === f ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#DFE5ED] bg-white hover:border-[#3D8BD0]'
                }`}
              />
            ))}
          </div>
        ))}
        {field('shape', 'Shape', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'rectangle' as const, label: 'Rect' }, { value: 'rounded' as const, label: 'Rounded' }, { value: 'circle' as const, label: 'Circle' }]}
          />
        ))}
        {field('mediaRadius', 'Corner radius', (v, set) => <SliderRow value={v as number} onChange={set} min={0} max={24} />)}
        {field('mediaOverlay', 'Overlay', (v, set) => <SliderRow value={v as number} onChange={set} min={0} max={80} unit="%" />)}
        {field('captionPos', 'Caption position', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'below' as const, label: 'Below' }, { value: 'overlay' as const, label: 'Overlay' }, { value: 'hidden' as const, label: 'Hidden' }]}
          />
        ))}
      </>
    );
  },
};

/* ── The icon's box (data cards) ─────────────────────────────────────────── */

/** Icon colour, background, corner radius and border for the badge on a data card.
 *
 * ⚠️ OWN values only, read straight off this node — the same own-only rule `containerCss` keeps for
 * box keys, and `iconBoxCss` paints from exactly these. The fallbacks are the tile's RESTING look
 * (a white badge on a grey record tile, a grey badge on a white service tile), so each swatch shows
 * the colour actually on the canvas before anyone has touched it. */
export function IconBoxBlock(p: PackProps) {
  const own = p.styles[p.id] ?? {};
  const service = /^(favourites|services)-tile$/.test(p.id);
  const rest = service
    ? { color: '#475467', bg: '#F1F5F9', radius: 8 }
    : { color: '#5A6B80', bg: '#FFFFFF', radius: 6 };
  const set = (patch: Partial<NodeStyle>) => p.setStyle(p.id, patch);
  const pair = (key: 'iconColor' | 'iconFill' | 'iconBorderColor', fallback: string) => ({
    mode: portalColorMode(),
    light: String(own[key] ?? fallback),
    dark: String((own as Record<string, unknown>)[`dark:${key}`] ?? own[key] ?? fallback),
    onChange: (m: 'light' | 'dark', v: string) => set({ [modeKey(m, key)]: v } as Partial<NodeStyle>),
  });
  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3 first:mt-0">
        <span className="text-[13px] text-[#364658]">Icon colour</span>
        <span className="w-[176px]"><ColorField value={String(own.iconColor ?? rest.color)} onChange={(v) => set({ iconColor: v })} modes={pair('iconColor', rest.color)} /></span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[13px] text-[#364658]">Background</span>
        <span className="w-[176px]"><ColorField value={String(own.iconFill ?? rest.bg)} onChange={(v) => set({ iconFill: v })} modes={pair('iconFill', rest.bg)} /></span>
      </div>
      <RadiusRow value={Number(own.iconRadius ?? rest.radius)} onChange={(x) => set({ iconRadius: x })} />
      <BorderRow
        width={Number(own.iconBorderWidth ?? 0)}
        color={String(own.iconBorderColor ?? '#E5E7EB')}
        onWidth={(x) => set({ iconBorderWidth: x })}
        onColor={(x) => set({ iconBorderColor: x })}
        colorModes={pair('iconBorderColor', '#E5E7EB')}
        stroke={String(own.iconBorderStyle ?? 'solid')}
        onStroke={(x) => set({ iconBorderStyle: x })}
      />
    </>
  );
}

/* ── P6 — Icon ───────────────────────────────────────────────────────────── */

const P6_KEYS: (keyof NodeStyle)[] = ['iconSize', 'iconColor', 'iconShape', 'iconFill', 'iconPos'];

export const P6_Icon: StylePack = {
  id: 'P6', title: 'Icon', keys: P6_KEYS,
  Render: (p) => {
    const field = useField(p);
    const shape = resolve(p.styles, p.id, 'iconShape').value;
    return (
      <>
        {field('iconSize', 'Size', (v, set) => <SliderRow value={v as number} onChange={set} min={12} max={48} />)}
        {field('iconColor', 'Colour', (v, set) => <ColorField value={v as string} onChange={set} />)}
        {field('iconShape', 'Container shape', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'none' as const, label: 'None' }, { value: 'square' as const, label: 'Square' }, { value: 'circle' as const, label: 'Circle' }]}
          />
        ))}
        {shape !== 'none' && field('iconFill', 'Container fill', (v, set) => <ColorField value={v as string} onChange={set} />)}
        {field('iconPos', 'Position relative to text', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'left' as const, label: 'Left' }, { value: 'top' as const, label: 'Top' }, { value: 'right' as const, label: 'Right' }]}
          />
        ))}
      </>
    );
  },
};

/* ── P7 — Interactive states ─────────────────────────────────────────────── */

const P7_KEYS: (keyof NodeStyle)[] = ['hover', 'pressed', 'transition'];

export const P7_States: StylePack = {
  id: 'P7', title: 'Interactive states', keys: P7_KEYS,
  Render: (p) => {
    const field = useField(p);
    return (
      <>
        {field('hover', 'Hover treatment', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'none' as const, label: 'None' }, { value: 'lift' as const, label: 'Lift' }, { value: 'tint' as const, label: 'Tint' }, { value: 'outline' as const, label: 'Outline' }]}
          />
        ))}
        {field('pressed', 'Pressed treatment', (v, set) => (
          <Segmented value={v} onChange={set} options={[{ value: 'none' as const, label: 'None' }, { value: 'tint' as const, label: 'Tint' }]} />
        ))}
        {/* ⚠️ Focus ring is NOT an editor decision (§8.5). Shown as a locked-on row with a reason
            rather than hidden, so nobody goes hunting for a switch that should not exist. */}
        <ToggleRow
          label="Focus ring"
          on
          locked
          onChange={() => {}}
          lockNote="Always on. Keyboard users need to see where they are — this is not configurable."
        />
        <ToggleRow label="Disabled treatment" on locked onChange={() => {}} lockNote="Comes from the design system." />
        {field('transition', 'Transition speed', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'none' as const, label: 'None' }, { value: 'fast' as const, label: 'Fast' }, { value: 'normal' as const, label: 'Normal' }]}
          />
        ))}
      </>
    );
  },
};

/* ── P8 — Empty state ────────────────────────────────────────────────────── */

/* ⚠️ ONE field, down from four. Loading treatment and the error message were settings nobody could
   act on: a skeleton-versus-spinner choice is a decision about a state that lasts under a second and
   looks the same in the builder either way, and the error copy already had a platform default that
   was better than anything typed in a hurry. The empty state is different — for a widget like My CIs
   it is the state MOST requesters will see, and the choice it presents (say something, or take the
   widget off the page) genuinely changes the layout. So the pack keeps the question that has
   consequences and drops the three that were only configuration. */
const P8_KEYS: (keyof NodeStyle)[] = ['emptyMode', 'emptyMsg'];

export const P8_States: StylePack = {
  id: 'P8', title: 'Empty state', keys: P8_KEYS,
  Render: (p) => {
    const field = useField(p);
    return (
      <>
        {field('emptyMode', 'When there is nothing to show', (v, set) => (
          <Segmented
            value={v}
            onChange={set}
            options={[{ value: 'show' as const, label: 'Show message' }, { value: 'hide' as const, label: 'Hide widget' }]}
          />
        ))}
        {/* Only asked when it will be read — hiding the widget makes its message unreachable. */}
        {resolve(p.styles, p.id, 'emptyMode').value !== 'hide' && field('emptyMsg', 'Message', (v, set) => (
          <TextField value={v as string} onChange={set} placeholder="Nothing to show yet" />
        ))}
      </>
    );
  },
};

export const ALL_PACKS: Record<string, StylePack> = {
  P1: P1_Container, P2: P2_Size, P3: P3_Typography, P4: P4_Arrangement,
  P5: P5_Media, P6: P6_Icon, P7: P7_States, P8: P8_States,
};

/* Re-exported so widget files can reach the controls without a second import line. */
export { Chips, Field, Note, NumberField, SelectField, SliderRow, Segmented, TextField, ToggleRow, UploadZone };
