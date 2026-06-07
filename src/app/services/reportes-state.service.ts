import { Injectable } from '@angular/core';
import { StoredBdiResult } from './bdi-submission.service';

@Injectable({
  providedIn: 'root'
})
export class ReportesStateService {
  searchName = '';
  searched = false;
  foundResults: StoredBdiResult[] = [];
  selectedResult: StoredBdiResult | null = null;
  selectedPatientKey: string | null = null;
  selectedPatientName = '';

  clear(): void {
    this.searchName = '';
    this.searched = false;
    this.foundResults = [];
    this.selectedResult = null;
    this.selectedPatientKey = null;
    this.selectedPatientName = '';
  }
}
