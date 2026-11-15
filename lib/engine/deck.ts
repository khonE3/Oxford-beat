import type { VocabWord } from "../vocab/types";

export type Rng = () => number;

/** Fisher–Yates shuffle. Returns a new array; the input is not mutated. */
export function fisherYates<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DeckState {
  /** Ids not drawn yet in the current cycle, in draw order. */
  queue: string[];
  /** Ids already drawn in the current cycle, in draw order. */
  drawn: string[];
}

/**
 * Shuffle deck that guarantees no word repeats until every word in the pool
 * has been drawn once. State can be persisted between games.
 */
export class WordDeck {
  private readonly byId: Map<string, VocabWord>;
  private readonly ids: string[];
  private queue: string[];
  private drawn: string[];

  constructor(
    pool: readonly VocabWord[],
    saved: DeckState | null = null,
    private readonly rng: Rng = Math.random,
    private readonly onChange?: (state: DeckState) => void,
  ) {
    if (pool.length === 0) throw new Error("WordDeck: pool is empty");
    this.byId = new Map(pool.map((w) => [w.id, w]));
    this.ids = [...this.byId.keys()];

    if (saved && Array.isArray(saved.queue) && Array.isArray(saved.drawn)) {
      const seen = new Set<string>();
      const keep = (id: string) => {
        if (!this.byId.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      };
      this.drawn = saved.drawn.filter(keep);
      this.queue = saved.queue.filter(keep);
      // Words added to the pool since the state was saved: insert at random positions.
      for (const id of this.ids) {
        if (seen.has(id)) continue;
        const pos = Math.floor(this.rng() * (this.queue.length + 1));
        this.queue.splice(pos, 0, id);
      }
    } else {
      this.drawn = [];
      this.queue = fisherYates(this.ids, this.rng);
    }
  }

  get total(): number {
    return this.ids.length;
  }

  get remaining(): number {
    return this.queue.length;
  }

  getState(): DeckState {
    return { queue: this.queue.slice(), drawn: this.drawn.slice() };
  }

  /**
   * Draws the next word. If `accept` is given, the first acceptable word within
   * the next `lookahead` queued words is chosen (falls back to the head of the queue).
   */
  draw(accept?: (word: VocabWord) => boolean, lookahead = 8): VocabWord {
    if (this.queue.length === 0) this.refill();

    let index = 0;
    if (accept) {
      const limit = Math.min(lookahead, this.queue.length);
      for (let i = 0; i < limit; i++) {
        if (accept(this.byId.get(this.queue[i])!)) {
          index = i;
          break;
        }
      }
    }

    const [id] = this.queue.splice(index, 1);
    this.drawn.push(id);
    this.onChange?.(this.getState());
    return this.byId.get(id)!;
  }

  private refill(): void {
    const last = this.drawn[this.drawn.length - 1];
    const next = fisherYates(this.ids, this.rng);
    // Avoid the same word appearing twice in a row across the cycle boundary.
    if (next.length > 1 && next[0] === last) {
      next.push(next.shift()!);
    }
    this.queue = next;
    this.drawn = [];
  }
}
