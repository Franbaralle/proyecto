import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';
import { PacienteProfileService } from '../../services/paciente-profile.service';

@Component({
  selector: 'app-acceso-reportes',
  templateUrl: './acceso-reportes.component.html',
  styleUrls: ['./acceso-reportes.component.css']
})
export class AccesoReportesComponent implements OnInit {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly profileService: PacienteProfileService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.currentEmail) {
      this.router.navigate(['/reportes']);
    }
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Debe ingresar su email.';
      return;
    }
    if (!this.password) {
      this.errorMessage = 'Debe ingresar su contraseña.';
      return;
    }

    const emailNorm = this.email.trim().toLowerCase();
    this.isLoading = true;

    try {
      await this.patientAuth.login(emailNorm, this.password);

      // Verificar que el usuario es realmente un psicólogo registrado
      const esPsicologo = await this.profileService.psicologoEmailExists(emailNorm);
      if (!esPsicologo) {
        await this.patientAuth.logout();
        this.errorMessage = 'Esta cuenta no corresponde a un psicólogo/a registrado/a. Use el acceso de pacientes.';
        return;
      }

      this.authService.login(emailNorm);

      const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
      if (redirectTo && redirectTo !== '/home' && redirectTo !== '/seleccion-test') {
        this.router.navigateByUrl(redirectTo);
      } else {
        this.router.navigate(['/reportes']);
      }
    } catch (error: unknown) {
      this.errorMessage = this.mapError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private mapError(error: unknown): string {
    if (!(error instanceof Error)) { return 'Error inesperado. Intente nuevamente.'; }
    if (error.message.includes('user-not-found') || error.message.includes('invalid-credential') || error.message.includes('wrong-password')) {
      return 'Email o contraseña incorrectos.';
    }
    if (error.message.includes('invalid-email')) { return 'El email ingresado no es válido.'; }
    if (error.message.includes('too-many-requests')) { return 'Demasiados intentos. Intente más tarde.'; }
    return 'No se pudo iniciar sesión. Verifique sus datos.';
  }
}
