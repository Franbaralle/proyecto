import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportesAuthService {
  private readonly storageKey = 'reportes_access_email';
  readonly allowedEmail = 'diegoacastillopsi@gmail.com';

  private get storage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage;
  }

  login(email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return false;
    }

    this.storage?.setItem(this.storageKey, normalizedEmail);
    return true;
  }

  logout(): void {
    this.storage?.removeItem(this.storageKey);
  }

  get currentEmail(): string {
    return this.storage?.getItem(this.storageKey) ?? '';
  }

  get isAuthorized(): boolean {
    return this.currentEmail.length > 0;
  }

  get isDiegoSession(): boolean {
    return this.currentEmail === this.allowedEmail;
  }
}
