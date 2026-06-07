import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PacienteProfileService } from '../../services/paciente-profile.service';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  nombreApellidos = '';
  email = '';
  password = '';
  confirmPassword = '';
  codigoPsicologo = '';
  estadoCivil = '';
  edad: number | null = null;
  sexo = '';
  ocupacion = '';
  educacion = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly patientAuth: PatientAuthService,
    private readonly profileService: PacienteProfileService,
    private readonly router: Router
  ) {}

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this.nombreApellidos.trim() || !this.email.trim() || !this.password || !this.codigoPsicologo.trim()) {
      this.errorMessage = 'Complete los campos obligatorios (*)';
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

    this.isLoading = true;

    try {
      const psicologo = await this.profileService.getPsicologoByCodigo(this.codigoPsicologo);
      if (!psicologo) {
        this.errorMessage = 'Código de psicólogo inválido. Verifiquelo con su analista.';
        return;
      }

      const user = await this.patientAuth.register(this.email, this.password);

      await this.profileService.createProfile(user.uid, {
        email: this.email.trim().toLowerCase(),
        nombreApellidos: this.nombreApellidos.trim(),
        estadoCivil: this.estadoCivil,
        edad: this.edad,
        sexo: this.sexo,
        ocupacion: this.ocupacion.trim(),
        educacion: this.educacion,
        psicologoEmail: psicologo.email,
        psicologoNombre: psicologo.nombre,
        testsHabilitados: [],
        creadoEn: new Date().toISOString()
      });

      this.router.navigate(['/seleccion-test']);
    } catch (error: unknown) {
      this.errorMessage = this.mapError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private mapError(error: unknown): string {
    if (!(error instanceof Error)) { return 'Error inesperado. Intente nuevamente.'; }
    if (error.message.includes('email-already-in-use')) { return 'Ya existe una cuenta con ese email.'; }
    if (error.message.includes('invalid-email')) { return 'El email ingresado no es válido.'; }
    if (error.message.includes('weak-password')) { return 'La contraseña es muy débil. Use al menos 6 caracteres.'; }
    if (error.message.includes('permission-denied') || error.message.includes('Missing or insufficient')) {
      return 'Error de permisos en la base de datos. Contacte al administrador.';
    }
    return `Error: ${error.message}`;
  }
}
