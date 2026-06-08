import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BdiDataService } from '../services/bdi-data.service';
import { BaiDataService } from '../services/bai-data.service';
import { BdiSubmissionService } from '../services/bdi-submission.service';
import { BaiSubmissionService } from '../services/bai-submission.service';
import { IhlDataService } from '../services/ihl-data.service';
import { IhlSubmissionService } from '../services/ihl-submission.service';
import { ReportesAuthService } from '../services/reportes-auth.service';
import { PatientAuthService } from '../services/patient-auth.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioAccessGuard implements CanActivate {
  constructor(
    private readonly bdiData: BdiDataService,
    private readonly baiData: BaiDataService,
    private readonly ihlData: IhlDataService,
    private readonly submissionService: BdiSubmissionService,
    private readonly baiSubmissionService: BaiSubmissionService,
    private readonly ihlSubmissionService: IhlSubmissionService,
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  async canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    await this.patientAuth.waitForInit();

    if (this.authService.isAuthorized) {
      return true;
    }

    const isAnsiedad = state.url.startsWith('/ansiedad');
    const isIhl = state.url.startsWith('/ihl');
    const testType = isAnsiedad ? 'BAI' : isIhl ? 'IHL' : 'BDI-II';
    const patientData = isAnsiedad ? this.baiData.patient : isIhl ? this.ihlData.patient : this.bdiData.patient;
    const patientName = patientData.nombreApellidos?.trim();

    if (!patientName) {
      return this.patientAuth.isLoggedIn
        ? this.router.createUrlTree(['/seleccion-test'])
        : this.router.createUrlTree(['/home']);
    }

    const patientEmail = this.authService.currentEmail
      ?? this.patientAuth.currentEmail
      ?? undefined;

    try {
      const submissionService = isAnsiedad
        ? this.baiSubmissionService
        : isIhl
          ? this.ihlSubmissionService
          : this.submissionService;

      const yaCompletado = await submissionService.hasCurrentAttempt(
        patientName,
        testType,
        patientEmail
      );
      if (yaCompletado) {
        return this.router.createUrlTree(['/seleccion-test']);
      }
    } catch {
      // Si Firebase falla, permitir el acceso
    }

    return true;
  }
}
