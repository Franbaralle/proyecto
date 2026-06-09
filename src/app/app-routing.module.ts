import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { AccesoReportesComponent } from './pages/acceso-reportes/acceso-reportes.component';
import { ReportesAuthGuard } from './guards/reportes-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { InventarioAccessGuard } from './guards/inventario-access.guard';
import { SeleccionTestComponent } from './pages/seleccion-test/seleccion-test.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { LoginPacienteComponent } from './pages/login-paciente/login-paciente.component';
import { RegistroPsicologoComponent } from './pages/registro-psicologo/registro-psicologo.component';
import { AnsiedadComponent } from './pages/ansiedad/ansiedad.component';
import { IhlComponent } from './pages/ihl/ihl.component';
import { MbiComponent } from './pages/mbi/mbi.component';
import { CopsoqComponent } from './pages/copsoq/copsoq.component';

const routes: Routes = [
  { path: '', redirectTo: 'acceso-reportes', pathMatch: 'full' },
  { path: 'login', component: LoginPacienteComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'registro-psicologo', component: RegistroPsicologoComponent },
  { path: 'home', component: HomeComponent, canActivate: [SessionAuthGuard] },
  { path: 'seleccion-test', component: SeleccionTestComponent, canActivate: [SessionAuthGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [SessionAuthGuard, InventarioAccessGuard] },
  { path: 'ansiedad', component: AnsiedadComponent, canActivate: [SessionAuthGuard, InventarioAccessGuard] },
  { path: 'ihl', component: IhlComponent, canActivate: [SessionAuthGuard, InventarioAccessGuard] },
  { path: 'mbi', component: MbiComponent, canActivate: [SessionAuthGuard, InventarioAccessGuard] },
  { path: 'copsoq', component: CopsoqComponent, canActivate: [SessionAuthGuard, InventarioAccessGuard] },
  { path: 'acceso-reportes', component: AccesoReportesComponent },
  { path: 'reportes', component: ReportesComponent, canActivate: [ReportesAuthGuard] },
  { path: '**', redirectTo: 'acceso-reportes' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
