import { Canton } from './Canton';
import { LineSection } from './LineSection';
import { Pole } from './Pole';
import { Vector } from './Vector';

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

    calcMechanicalConstraint(): void {
        const lineSections = this.getAllLineSections();
        this.poles.forEach(pole => {
            const lsStartList = lineSections.filter(ls => pole === ls.section.startPole);
            const lsEndList = lineSections.filter(ls => pole === ls.section.endPole);
            const lsStartVectors = lsStartList.map(ls => ls.getMechanicalConstraintStartVector());
            const lsEndVectors = lsEndList.map(ls => ls.getMechanicalConstraintEndVector());
            const reduceStart = lsStartVectors.reduce((a, v) => a.add(v), new Vector(0, 0));
            const reduceEnd = lsEndVectors.reduce((a, v) => a.add(v), new Vector(0, 0));
            pole.mechanicalConstraint = reduceStart.add(reduceEnd);
        });
    }

    getAllLineSections(): LineSection[] {
        return this.cantons.flatMap(canton => canton.sections.flatMap(section => section.lineSections));
    }

    calcWindConstraint(): void {
        const lineSections = this.getAllLineSections();
        this.poles.forEach(pole => {
            const lsStartList = lineSections.filter(ls => pole === ls.section.startPole);
            const lsEndList = lineSections.filter(ls => pole === ls.section.endPole);
            const windConstraints = Array(360).fill(null).map((_, i) => i).map(a => {
                    // if(p.id == 1 && a == 0) {
                    //     const xxx = 0;
                    // }
                    const angle = a * Math.PI / 180;
                    const reduceStart = lsStartList.map(ls => ls.getWindConstraintStartVector(angle)).reduce((acc, v) => acc + v, 0);
                    const reduceEnd = lsEndList.map(ls => ls.getWindConstraintEndVector(angle)).reduce((acc, v) => acc + v, 0);
                    const windConstraint = reduceStart + reduceEnd;
                    return Vector.getVector(windConstraint, angle);
                });
            const maxWindConstraint = windConstraints.reduce((max, current) => current.intensity > max.intensity ? current : max , new Vector(0, 0));
            pole.windConstraint = maxWindConstraint;
        });
    }

    calcTotalConstraint(): void {
        this.poles.forEach(pole => {
            pole.totalConstraint = pole.mechanicalConstraint.add(pole.windConstraint);
        });
    }
}
