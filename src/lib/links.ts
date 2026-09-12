// Linking / interconnection: the SECOND axis of a repeater, independent of how it
// modulates.
//
// EchoLink and AllStar used to sit in MODE_OPTIONS beside FM and DMR, which said
// three untrue things: that they are modulations, that they are comparable to a
// modulation, and (because the mode filter ORs its values) that "FM + EchoLink"
// means "FM or EchoLink" when an operator plainly means "FM repeaters that have
// EchoLink". They are properties: any FM repeater can be EchoLink or AllStar
// enabled, and the same is true one level down for every digital mode, which
// carries its own network (Brandmeister for DMR, a reflector for D-STAR,
// Wires-X or YSF for C4FM).
//
// So linking is one axis spanning every mode. Within the axis values OR; across
// axes they AND.
//
// Every one of these fields is empty for all 188 repeaters in the CMS today, so
// the chips carry a match count and a zero disables the chip. The axis stays
// visible either way: it is what the directory knows how to record, and hiding it
// would make a filter that exists look like one that was never built.

import type { RepeaterV2 as Repeater } from "@/types/repeater"

export type LinkKey =
  | "EchoLink"
  | "AllStar"
  | "Brandmeister"
  | "DSTARReflector"
  | "WiresX"
  | "YSF"

export interface LinkOption {
  /** Written into the `links` filter and the ?links= URL param. */
  value: LinkKey
  /** Shown to the operator. A network name is a proper noun, not copy, so it is
   *  identical in every locale and deliberately does not go through t(). */
  label: string
  /** The modulation this linking system rides on, for the tooltip/description. */
  ridesOn: string
}

export const LINK_OPTIONS: LinkOption[] = [
  { value: "EchoLink", label: "EchoLink", ridesOn: "FM" },
  { value: "AllStar", label: "AllStar", ridesOn: "FM" },
  { value: "Brandmeister", label: "Brandmeister", ridesOn: "DMR" },
  { value: "DSTARReflector", label: "Reflector D-STAR", ridesOn: "D-STAR" },
  { value: "WiresX", label: "Wires-X", ridesOn: "C4FM" },
  { value: "YSF", label: "YSF", ridesOn: "C4FM" },
]

export const LINK_VALUES: LinkKey[] = LINK_OPTIONS.map((l) => l.value)

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * Does this repeater carry that linking system?
 *
 * Reads the top-level fields for the two analogue links and the per-mode config
 * objects for the rest, because that is where the schema puts them.
 */
export function hasLink(repeater: Repeater, link: LinkKey): boolean {
  switch (link) {
    case "EchoLink":
      return repeater.echolink?.enabled === true
    case "AllStar":
      return repeater.allstarNode != null
    case "Brandmeister": {
      const network = text(repeater.dmr?.network).toLowerCase()
      // "Brandmeister", "BrandMeister", "BM" are all the same network.
      return network.includes("brandmeister") || network === "bm"
    }
    case "DSTARReflector":
      return text(repeater.dstar?.reflector) !== ""
    case "WiresX":
      return repeater.c4fm?.network === "wires-x" || text(repeater.c4fm?.node) !== ""
    case "YSF":
      return repeater.c4fm?.network === "ysf"
    default:
      return false
  }
}

/** OR within the axis. An empty selection matches everything. */
export function matchesLinks(repeater: Repeater, links: readonly string[]): boolean {
  if (!links || links.length === 0) return true
  return links.some((link) => hasLink(repeater, link as LinkKey))
}

export interface LinkOptionCount extends LinkOption {
  /** How many repeaters in the current dataset carry this link. */
  count: number
}

/**
 * The whole canonical axis, each entry carrying how many repeaters actually have
 * it.
 *
 * An earlier version returned only the systems present in the data, so with the
 * CMS link fields empty the entire row disappeared and the filter looked like it
 * had never been built. Showing the axis with a visible count is the better
 * trade: the operator sees which linking systems the directory knows about, a
 * zero says plainly that none are recorded yet rather than pretending, and the
 * chip is disabled so it can never return an empty page by surprise.
 */
export function linkOptionCounts(repeaters: readonly Repeater[]): LinkOptionCount[] {
  return LINK_OPTIONS.map((option) => ({
    ...option,
    count: (repeaters ?? []).reduce(
      (total, repeater) => total + (hasLink(repeater, option.value) ? 1 : 0),
      0
    ),
  }))
}

/** Every linking system a single repeater carries, for badges. */
export function linksOf(repeater: Repeater): LinkOption[] {
  return LINK_OPTIONS.filter((option) => hasLink(repeater, option.value))
}

/**
 * A node number or reflector worth showing, since that is the actionable part:
 * an operator wants the number to connect to, not just the fact it exists.
 */
export function linkDetail(repeater: Repeater, link: LinkKey): string | null {
  switch (link) {
    case "EchoLink": {
      // The conference is the more meaningful label: it says WHO you reach, where
      // the node number only says how to dial in. Only 7 of the 24 EchoLink
      // repeaters carry one though, so the node stays as the fallback rather than
      // leaving the other 17 with a bare "EchoLink" and nothing actionable.
      const conference = text(repeater.echolink?.conference)
      if (conference) return conference
      const node = repeater.echolink?.nodeNumber
      return node != null ? String(node) : null
    }
    case "AllStar":
      return repeater.allstarNode != null ? String(repeater.allstarNode) : null
    case "DSTARReflector":
      return text(repeater.dstar?.reflector) || null
    case "WiresX":
      return text(repeater.c4fm?.node) || text(repeater.c4fm?.room) || null
    case "Brandmeister":
    case "YSF":
    default:
      return null
  }
}

/** Legacy: ?modes=EchoLink / ?modes=AllStar from before links had their own axis. */
export function legacyModeToLink(value: string): LinkKey | null {
  const v = value.trim().toLowerCase()
  if (v === "echolink") return "EchoLink"
  if (v === "allstar" || v === "allstarlink") return "AllStar"
  return null
}
