import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ReportesAuthService } from '../services/reportes-auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportesAuthGuard implements CanActivate {
  constructor(
    private readonly authService: ReportesAuthService,
    private readonly router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isAuthorized) {
      return true;
    }

    return this.router.createUrlTree(['/acceso-reportes'], {
      queryParams: { redirectTo: state.url }
    });
  }
}
