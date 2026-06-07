import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-login-paciente',
  templateUrl: './login-paciente.component.html',
  styleUrls: ['./login-paciente.component.css']
})
export class LoginPacienteComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingrese email y contraseña.';
      return;
    }

    this.isLoading = true;

    try {
      await this.patientAuth.login(this.email, this.password);
      this.router.navigate(['/seleccion-test']);
    } catch (error: unknown) {
      this.errorMessage = this.mapError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private mapError(error: unknown): string {
    if (!(error instanceof Error)) { return 'Error inesperado.'; }
    if (
      error.message.includes('user-not-found') ||
      error.message.includes('wrong-password') ||
      error.message.includes('invalid-credential')
    ) {
      return 'Email o contraseña incorrectos.';
    }
    if (error.message.includes('invalid-email')) { return 'El email no es válido.'; }
    if (error.message.includes('too-many-requests')) { return 'Demasiados intentos. Intente más tarde.'; }
    return 'No se pudo iniciar sesión. Verifique sus datos.';
  }
}
