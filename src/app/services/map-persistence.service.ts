/**
 * Map Persistence Service
 * Handles saving and loading application state from localStorage.
 */

import { Injectable } from '@angular/core';
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
      const text = JSON.stringify(this.state.project, jsonIgnoreReplacer);
      localStorage.setItem(STORAGE_KEY, text);
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
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return;
      const data = JSON.parse(text);
      this.state.project = Project.fromJSON(data);
    } catch (error) {
      console.error('Failed to load state:', error);
      this.state.project = new Project([], []);
    }
  }
}
