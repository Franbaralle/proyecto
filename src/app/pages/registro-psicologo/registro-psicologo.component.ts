import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PacienteProfileService } from '../../services/paciente-profile.service';
import { PatientAuthService } from '../../services/patient-auth.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';

@Component({
  selector: 'app-registro-psicologo',
  templateUrl: './registro-psicologo.component.html',
  styleUrls: ['./registro-psicologo.component.css']
})
export class RegistroPsicologoComponent {
  nombre = '';
  email = '';
  matricula = '';
  password = '';
  confirmPassword = '';

  isLoading = false;
  errorMessage = '';
  codigoGenerado = '';
  registroExitoso = false;

  constructor(
    private readonly patientAuth: PatientAuthService,
    private readonly profileService: PacienteProfileService,
    private readonly reportesAuth: ReportesAuthService,
    private readonly router: Router
  ) {}

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this.nombre.trim() || !this.email.trim() || !this.matricula.trim() || !this.password) {
      this.errorMessage = 'Complete todos los campos obligatorios (*).';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    const emailNorm = this.email.trim().toLowerCase();

    this.isLoading = true;

    try {
      const existe = await this.profileService.psicologoEmailExists(emailNorm);
      if (existe) {
        this.errorMessage = 'Ya existe una cuenta de psicólogo/a con ese email.';
        return;
      }

      await this.patientAuth.register(emailNorm, this.password);

      const profile = await this.profileService.createPsicologoProfile({
        nombre: this.nombre.trim(),
        email: emailNorm,
        matricula: this.matricula.trim()
      });

      this.codigoGenerado = profile.codigoAcceso;
      this.registroExitoso = true;

      // Iniciar sesión directamente en el panel de reportes
      this.reportesAuth.login(emailNorm);
    } catch (error: unknown) {
      this.errorMessage = this.mapError(error);
    } finally {
      this.isLoading = false;
    }
  }

  irAReportes(): void {
    this.router.navigate(['/reportes']);
  }

  private mapError(error: unknown): string {
    if (!(error instanceof Error)) { return 'Error inesperado. Intente nuevamente.'; }
    if (error.message.includes('email-already-in-use')) { return 'Ya existe una cuenta con ese email.'; }
    if (error.message.includes('invalid-email')) { return 'El email ingresado no es válido.'; }
    if (error.message.includes('weak-password')) { return 'La contraseña es muy débil. Use al menos 6 caracteres.'; }
    if (error.message.includes('permission-denied') || error.message.includes('Missing or insufficient')) {
      return 'Error de permisos en la base de datos. Contacte al administrador.';
    }
    // Mostrar el mensaje real en desarrollo para facilitar diagnóstico
    return `Error: ${error.message}`;
  }
}
