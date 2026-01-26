import { Canton } from './Canton';
import { Pole } from './Pole';

export class Project {
    public cantons: Canton[];
    public poles: Pole[];

    constructor(cantons: Canton[], poles: Pole[]) {
        this.cantons = cantons;
        this.poles = poles;
    }
}
