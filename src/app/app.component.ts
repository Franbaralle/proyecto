import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReportesAuthService } from './services/reportes-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'inventario-beck';

  constructor(
    public readonly reportesAuth: ReportesAuthService,
    private readonly router: Router
  ) {}

  cerrarSesion(): void {
    this.reportesAuth.logout();
    this.router.navigate(['/acceso-reportes']);
  }

  get currentEmail(): string {
    return this.reportesAuth.currentEmail;
  }

  get isDiegoSession(): boolean {
    return this.reportesAuth.isDiegoSession;
  }
}
