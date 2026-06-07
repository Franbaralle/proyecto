import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ReportesAuthService } from '../services/reportes-auth.service';
import { PatientAuthService } from '../services/patient-auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  async canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    await this.patientAuth.waitForInit();

    // Psicólogo: acceso via sessionStorage
    if (this.authService.currentEmail) {
      if (this.authService.isAuthorized && state.url === '/home') {
        return this.router.createUrlTree(['/reportes']);
      }
      return true;
    }

    // Paciente: acceso via Firebase Auth
    if (this.patientAuth.isLoggedIn) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}
