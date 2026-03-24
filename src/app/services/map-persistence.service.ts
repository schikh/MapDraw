/**
 * Map Persistence Service
 * Handles saving and loading application state from localStorage.
 */

import { Injectable } from '@angular/core';
import { Canton } from '../model/Canton';
import { Pole } from '../model/Pole';
import { Position } from '../model/Position';
import { Project } from '../model/Project';
import { MapStateService } from './map-state.service';

const STORAGE_KEY = 'map-drawing-app-state';

@Injectable({
  providedIn: 'root'
})
export class MapPersistenceService {

  constructor(private state: MapStateService) {}

  /**
   * Saves current state to localStorage.
   */
  saveState(): void {
    try {
      const data: Project = {
        poles: this.state.project.poles,
        cantons: this.state.project.cantons
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save state:', error);
      this.state.showMessage('error', 'Failed to save data.');
    }
  }

  /**
   * Loads state from localStorage into the state service.
   */
  loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      const rawPoles: any[] = data.poles ?? [];
      const rawCantons: any[] = data.cantons ?? [];

      // Reconstruct Pole instances; handles legacy data that stored `coordinates`
      var poles = rawPoles.map((sp: any) => {
        const pos = new Position(sp.position.x, sp.position.y);
        return new Pole(
          sp.id,
          sp.strength ?? 500,
          sp.height ?? 12,
          sp.rotation ?? 0,
          sp.aboveGroundHeight ?? 10,
          pos,
        );
      });

      // Reconstruct Canton instances; addPole() automatically builds poleIds and Sections
      var cantons = rawCantons.map((sc: any) => {
        const canton = new Canton();
        const resolvedPoles: Pole[] = (sc.poleIds ?? [])
          .map((id: string) => poles.find(p => p.id === id)!)
          .filter((p: Pole) => p !== undefined);
        for (const pole of resolvedPoles) {
          canton.addPole(pole);
        }
        return canton;
      });

      this.state.project = new Project(cantons, poles);
    } catch (error) {
      console.error('Failed to load state:', error);
      this.state.project = new Project([], []);
    }
  }
}
