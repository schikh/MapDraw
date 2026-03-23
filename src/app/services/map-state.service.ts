/**
 * Map State Service
 * Manages shared state, observables, and notifications for the map drawing application.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { DragPan } from 'ol/interaction';
import { Canton, Pole, Project } from '../model';

/** Drawing mode enumeration */
export type DrawingMode = 'none' | 'pole' | 'canton' | 'rotate' | 'move' | 'remove-canton' | 'remove-pole';

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  // ============================================================
  // DATA STORAGE
  // ============================================================

  // poles: Pole[] = [];
  // cantons: Canton[] = [];

  project!: Project;

  // ============================================================
  // OPENLAYERS REFERENCES (set during map initialization)
  // ============================================================

  map!: Map;
  poleSource!: VectorSource;
  cantonSource!: VectorSource;
  tempLineSource!: VectorSource;
  leverSource!: VectorSource;
  dragPanInteraction: DragPan | null = null;

  // ============================================================
  // DRAWING STATE
  // ============================================================

  currentMode: DrawingMode = 'none';
  cantonPoleIds: string[] = [];
  lastMousePosition: [number, number] | null = null;

  // Selection / interaction state
  selectedPoleId: string | null = null;
  selectedCantonId: string | null = null;
  isRotating = false;
  isMoving = false;

  // ============================================================
  // OBSERVABLES
  // ============================================================

  private modeSubject = new BehaviorSubject<DrawingMode>('none');
  private messageSubject = new BehaviorSubject<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  private cursorCoordsSubject = new BehaviorSubject<string>('');
  private statsSubject = new BehaviorSubject<{ poles: number; cantons: number }>({ poles: 0, cantons: 0 });
  private editPoleSubject = new Subject<Pole>();
  private editCantonSubject = new Subject<Canton>();

  readonly mode$ = this.modeSubject.asObservable();
  readonly message$ = this.messageSubject.asObservable();
  readonly cursorCoords$ = this.cursorCoordsSubject.asObservable();
  readonly stats$ = this.statsSubject.asObservable();
  readonly editPole$ = this.editPoleSubject.asObservable();
  readonly editCanton$ = this.editCantonSubject.asObservable();

  // ============================================================
  // STATE METHODS
  // ============================================================

  /** Emits a new drawing mode. */
  setMode(mode: DrawingMode): void {
    this.currentMode = mode;
    this.modeSubject.next(mode);
  }

  /** Returns the current drawing mode. */
  getMode(): DrawingMode {
    return this.currentMode;
  }

  /** Updates cursor coordinates display text. */
  setCursorCoords(text: string): void {
    this.cursorCoordsSubject.next(text);
  }

  /** Emits that a pole should be opened for editing. */
  emitEditPole(pole: Pole): void {
    this.editPoleSubject.next(pole);
  }

  /** Emits that a canton should be opened for editing. */
  emitEditCanton(canton: Canton): void {
    this.editCantonSubject.next(canton);
  }

  /** Shows a status message to the user. Auto-clears non-error messages after 5 seconds. */
  showMessage(type: 'success' | 'error' | 'info', text: string): void {
    this.messageSubject.next({ type, text });
    if (type !== 'error') {
      setTimeout(() => {
        const current = this.messageSubject.getValue();
        if (current?.text === text) {
          this.messageSubject.next(null);
        }
      }, 5000);
    }
  }

  /** Updates pole/canton statistics. */
  updateStats(): void {
    this.statsSubject.next({
      poles: this.project.poles.length,
      cantons: this.project.cantons.length
    });
  }

  /** Returns statistics about the current data. */
  getStats(): { poles: number; cantons: number } {
    return {
      poles: this.project.poles.length,
      cantons: this.project.cantons.length
    };
  }

  /** Generates a unique ID for features. */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
