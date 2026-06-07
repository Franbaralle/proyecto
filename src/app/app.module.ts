import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { AccesoReportesComponent } from './pages/acceso-reportes/acceso-reportes.component';
import { SeleccionTestComponent } from './pages/seleccion-test/seleccion-test.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { LoginPacienteComponent } from './pages/login-paciente/login-paciente.component';
import { RegistroPsicologoComponent } from './pages/registro-psicologo/registro-psicologo.component';
import { AnsiedadComponent } from './pages/ansiedad/ansiedad.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    InventarioComponent,
    ReportesComponent,
    AccesoReportesComponent,
    SeleccionTestComponent,
    RegistroComponent,
    LoginPacienteComponent,
    RegistroPsicologoComponent,
    AnsiedadComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgChartsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
