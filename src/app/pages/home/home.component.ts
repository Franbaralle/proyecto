import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BdiDataService } from '../../services/bdi-data.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  constructor(
    public readonly bdiData: BdiDataService,
    private readonly authService: ReportesAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Pre-poblar el email del paciente con el email de sesión
    if (this.authService.currentEmail) {
      this.bdiData.patient.email = this.authService.currentEmail;
    }
  }

  fillDemoData(): void {
    this.bdiData.fillDemoData();
  }

  clearData(): void {
    this.bdiData.patient = {
      nombreApellidos: '',
      estadoCivil: '',
      edad: null,
      sexo: '',
      ocupacion: '',
      educacion: '',
      fecha: '',
      email: ''
    };

    this.bdiData.professional = {
      profesional: '',
      matricula: '',
      domicilio: '',
      email: '',
      telefono: ''
    };

    this.bdiData.clearSession();
  }

  goNext(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.bdiData.saveSession();
    this.router.navigate(['/seleccion-test']);
  }

}
