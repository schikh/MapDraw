/**
 * Map Persistence Service
 * Handles saving and loading application state from localStorage.
 */

import { Injectable } from '@angular/core';
import { Canton } from '../model/Canton';
import { Line } from '../model/Line';
import { Pole } from '../model/Pole';
import { Position } from '../model/Position';
import { Project } from '../model/Project';
import { MapStateService } from './map-state.service';
import { jsonIgnoreReplacer } from 'json-ignore';

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
      const data: any = {
        poles: this.state.project.poles,
        cantons: this.state.project.cantons
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data, jsonIgnoreReplacer));
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

      var poles = rawPoles.map((sp: any) => {
        return Pole.fromJSON(sp);
      });

      var cantons = rawCantons.map((sc: any) => {
        return Canton.fromJSON(sc, poles);
      });

      this.state.project = new Project(poles, cantons);
    } catch (error) {
      console.error('Failed to load state:', error);
      this.state.project = new Project([], []);
    }
  }
}
