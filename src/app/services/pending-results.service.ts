import { Injectable } from '@angular/core';

/**
 * Mantiene en sessionStorage qué tests han sido completados por el paciente
 * pero aún no enviados a Firestore.
 * El envío final ocurre desde la pantalla de selección de tests.
 */
@Injectable({
  providedIn: 'root'
})
export class PendingResultsService {
  private readonly KEY = 'bdi_pending_tests';

  getPending(): string[] {
    try {
      return JSON.parse(sessionStorage.getItem(this.KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  isPending(testType: string): boolean {
    return this.getPending().includes(testType);
  }

  markPending(testType: string): void {
    const pending = this.getPending();
    if (!pending.includes(testType)) {
      pending.push(testType);
    }
    sessionStorage.setItem(this.KEY, JSON.stringify(pending));
  }

  clearPending(testType: string): void {
    const pending = this.getPending().filter((t) => t !== testType);
    sessionStorage.setItem(this.KEY, JSON.stringify(pending));
  }

  clearAll(): void {
    sessionStorage.removeItem(this.KEY);
  }
}
