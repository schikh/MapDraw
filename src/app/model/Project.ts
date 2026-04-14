import { Canton } from './Canton';
import { Pole } from './Pole';

/**
 * Project is the single top-level container for all application data.
 * It is passed between services and serialised to / from localStorage.
 */
export class Project {
    public poles: Pole[];
    public cantons: Canton[];

    constructor(poles: Pole[] = [], cantons: Canton[] = []) {
        this.poles = poles;
        this.cantons = cantons;
    }

    // ── Query helpers ──────────────────────────────────────

    /** Generates a unique ID for features. */
    getNextPoleId(): number {
      if (this.poles.length === 0) return 1;
      return Math.max(...this.poles.map(p => p.id)) + 1;
    }

    getNextCantonId(): number {
      if (this.cantons.length === 0) return 1;
      return Math.max(...this.cantons.map(c => c.id)) + 1;
    }
    getPole(id: number): Pole | undefined {
        return this.poles.find((p) => p.id === id);
    }

    getCanton(id: number): Canton | undefined {
        return this.cantons.find((c) => c.id === id);
    }

    getCantonsByPole(poleId: number): Canton[] {
        return this.cantons.filter((c) => c.poleIds.includes(poleId));
    }

    // ── Serialisation ──────────────────────────────────────

    static fromJSON(json: any): Project {
        const rawPoles: any[] = json.poles ?? [];
        const rawCantons: any[] = json.cantons ?? [];
        var poles = rawPoles.map((sp: any) => Pole.fromJSON(sp));
        var cantons = rawCantons.map((sc: any) => Canton.fromJSON(sc, poles));
        return new Project(poles, cantons);
    }

    calc(): void {
        //canton.forEach
        //pole.forEach
    }
}
