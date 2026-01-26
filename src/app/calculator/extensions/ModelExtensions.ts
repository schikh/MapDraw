import { Canton } from '../model/Canton';
import { Line, ConstraintType } from '../model/Line';
import { LineSection } from '../model/LineSection';
import { Pole } from '../model/Pole';
import { PoleReference } from '../model/PoleReference';
import { Section } from '../model/Section';

export function getLineSections(cantons: Canton[]): LineSection[] {
    return cantons
        .flatMap(c => c.sections)
        .flatMap(s => s.lineSections.filter(ls => ls.line?.valid && ls.isLinked));
}

export function getPolesCantons(cantons: Canton[], poleId: number): Canton[] {
    return cantons.filter(c => 
        c.sections.some(s => s.startPole?.id === poleId || s.endPole?.id === poleId)
    );
}

export function getPoleStartLineSections(cantons: Canton[], poleId: number): LineSection[] {
    return cantons
        .flatMap(c => c.sections.filter(s => s.startPole?.id === poleId))
        .flatMap(s => s.lineSections);
}

export function getPoleEndLineSections(cantons: Canton[], poleId: number): LineSection[] {
    return cantons
        .flatMap(c => c.sections.filter(s => s.endPole?.id === poleId))
        .flatMap(s => s.lineSections);
}

export function setLineSectionsHangingHeight(cantons: Canton[], poleId: number, heightChange: number): void {
    getPoleStartLineSections(cantons, poleId).forEach(ls => {
        ls.hangingHeightFromGround += heightChange;
    });
    getPoleEndLineSections(cantons, poleId).forEach(ls => {
        ls.hangingHeightEndFromGround += heightChange;
    });
}

export function cutCanton(c: Canton, poleIndex: number): Canton {
    if (poleIndex <= 0) throw new Error("Can not cut at first pole");
    if (poleIndex >= c.poleReferences.length - 1) throw new Error("Can not cut at last pole");

    c.poleReferences.splice(0, poleIndex);
    c.sections.splice(0, poleIndex);
    for (const l of c.lines) {
        l.lineSections = l.lineSections.slice(poleIndex);
        l.fixConstraintType();
    }
    return c;
}

export function shortenCanton(c: Canton, poleIndex: number, copyLastHangingHeight: boolean = false, force: boolean = false): Canton {
    if (poleIndex <= 0) throw new Error("Can not cut at first pole");
    if (!force && poleIndex >= c.poleReferences.length - 1) throw new Error("Can not cut at last pole");

    c.poleReferences = c.poleReferences.slice(0, poleIndex + 1);
    c.sections = c.sections.slice(0, poleIndex);
    for (const l of c.lines) {
        if (copyLastHangingHeight) {
            const items = [...l.lineSections].reverse().slice(0, 2);
            if (items.length >= 2) {
                items[1].hangingHeightEndFromGround = items[1].hangingHeightFromGround;
            }
        }
        l.lineSections = l.lineSections.slice(0, poleIndex);
        l.fixConstraintType();
    }
    return c;
}

export function removePole(c: Canton, poleIndex: number): Canton {
    if (poleIndex < 0) throw new Error("Invalid pole index");
    if (poleIndex >= c.poleReferences.length) throw new Error("Invalid pole index");

    c.poleReferences.splice(poleIndex, 1);

    let sectionIndex = poleIndex;

    if (sectionIndex === c.sections.length) {
        sectionIndex--;
    } else if (sectionIndex > 0) {
        c.sections[sectionIndex - 1].endPole = c.sections[sectionIndex].endPole;
    }

    c.sections.splice(sectionIndex, 1);

    for (const l of c.lines) {
        l.lineSections.splice(sectionIndex, 1);
        l.fixConstraintType();
    }
    return c;
}

export function extendCanton(c: Canton, pole: Pole, sectionIndex: number): Canton {
    if (sectionIndex < 0) throw new Error("Invalid section index");
    if (sectionIndex >= c.sections.length) throw new Error("Invalid section index");

    const s1 = c.sections[sectionIndex];
    const s = new Section();
    s.startPole = pole;
    s.endPole = s1.endPole;
    c.sections.splice(sectionIndex + 1, 0, s);
    s1.endPole = pole;

    const pr = new PoleReference();
    pr.id = pole.id;
    pr.pole = pole;
    c.poleReferences.splice(sectionIndex + 1, 0, pr);

    for (const l of c.lines) {
        const ls1 = l.lineSections[sectionIndex];

        const ls = new LineSection();
        ls.isLinked = ls1.isLinked;
        ls.hangingHeightFromGround = pole.aboveGroundHeight - ls1.hangingHeightEndFromTop;
        ls.hangingHeightEndFromGround = ls1.hangingHeightEndFromGround;

        ls1.hangingHeightEndFromGround = ls.hangingHeightFromGround;

        l.lineSections.splice(sectionIndex, 0, ls);
        s.lineSections.push(ls);
        ls.line = l;
        ls.section = s;

        l.fixConstraintType();
    }
    return c;
}

export function extendCantonEnd(c: Canton, pole: Pole): Canton {
    const i = c.sections.length - 1;
    const pr = new PoleReference();
    pr.id = pole.id;
    pr.pole = pole;
    c.poleReferences.splice(i + 2, 0, pr);
    
    const s1 = c.sections[i];
    const s = new Section();
    s.startPole = s1.endPole;
    s.endPole = pole;
    c.sections.splice(i + 1, 0, s);
    
    for (const l of c.lines) {
        const ls1 = l.lineSections[i];

        const ls = new LineSection();
        ls.isLinked = ls1.isLinked;
        ls.hangingHeightFromGround = ls1.hangingHeightEndFromGround;
        ls.hangingHeightEndFromGround = pole.aboveGroundHeight - ls1.hangingHeightEndFromTop;

        l.lineSections.splice(i + 1, 0, ls);
        s.lineSections.push(ls);
        ls.line = l;
        ls.section = s;

        l.fixConstraintType();
    }
    return c;
}

export function extendCantonStart(c: Canton, pole: Pole): Canton {
    const pr = new PoleReference();
    pr.id = pole.id;
    pr.pole = pole;
    c.poleReferences.unshift(pr);
    
    const s1 = c.sections[0];
    const s = new Section();
    s.startPole = pole;
    s.endPole = s1.startPole;
    c.sections.unshift(s);
    
    for (const l of c.lines) {
        const ls1 = l.lineSections[0];

        const ls = new LineSection();
        ls.isLinked = ls1.isLinked;
        ls.hangingHeightFromGround = pole.aboveGroundHeight - ls1.hangingHeightFromTop;
        ls.hangingHeightEndFromGround = ls1.hangingHeightFromGround;

        l.lineSections.unshift(ls);
        s.lineSections.push(ls);
        ls.line = l;
        ls.section = s;

        l.fixConstraintType();
    }
    return c;
}

export function reverseCanton(c: Canton): Canton {
    c.sections.reverse();
    c.sections.forEach(s => {
        const temp = s.startPole;
        s.startPole = s.endPole;
        s.endPole = temp;
    });
    c.poleReferences.reverse();
    for (const line of c.lines) {
        line.lineSections.reverse();
        for (const ls of line.lineSections) {
            const temp = ls.hangingHeightFromGround;
            ls.hangingHeightFromGround = ls.hangingHeightEndFromGround;
            ls.hangingHeightEndFromGround = temp;
        }
    }
    return c;
}
