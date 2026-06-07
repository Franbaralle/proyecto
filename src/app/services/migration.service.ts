import { Injectable } from '@angular/core';
import { firestoreDb } from '../config/firebase.app';
import { collection, getDocs, updateDoc, WithFieldValue, DocumentData } from 'firebase/firestore';
import { CryptoService } from './crypto.service';

export interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

/**
 * Migra documentos existentes en las tres colecciones:
 * - bdiResultados: cifra respuestas, paciente, profesional, reevaluadoPor,
 *   motivoReevaluacion, diagnosticoGlobal, triangulacion, patientEmail,
 *   puntajeTotal y nivelDepresion
 * - pacientes: cifra campos PII individuales
 * - psicologos: cifra nombre y matricula
 * Los documentos ya totalmente cifrados se omiten.
 */
@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private readonly resultadosCol = 'bdiResultados';
  private readonly pacientesCol  = 'pacientes';
  private readonly psicologosCol = 'psicologos';

  private readonly PACIENTE_PII = [
    'nombreApellidos', 'email', 'estadoCivil', 'edad', 'sexo', 'ocupacion', 'educacion', 'psicologoNombre'
  ] as const;

  private readonly PSICOLOGO_PII = ['nombre', 'matricula'] as const;

  constructor(private readonly cryptoService: CryptoService) {}

  async migrateExistingResponses(
    onProgress?: (done: number, total: number) => void
  ): Promise<MigrationResult> {
    const [rSnap, pSnap, psSnap] = await Promise.all([
      getDocs(collection(firestoreDb, this.resultadosCol)),
      getDocs(collection(firestoreDb, this.pacientesCol)),
      getDocs(collection(firestoreDb, this.psicologosCol))
    ]);

    const allDocs = [
      ...rSnap.docs.map((d) => ({ doc: d, type: 'resultado' as const })),
      ...pSnap.docs.map((d) => ({ doc: d, type: 'paciente' as const })),
      ...psSnap.docs.map((d) => ({ doc: d, type: 'psicologo' as const }))
    ];

    const result: MigrationResult = {
      total: allDocs.length,
      migrated: 0,
      skipped: 0,
      errors: 0
    };

    let done = 0;

    for (const { doc: docSnap, type } of allDocs) {
      try {
        const data = docSnap.data();
        const updates: WithFieldValue<DocumentData> = {};
        let modified = false;

        if (type === 'resultado') {
          // respuestas
          const rawResp = data['respuestas'];
          if (Array.isArray(rawResp)) {
            updates['respuestas'] = await this.cryptoService.encryptJson(rawResp);
            modified = true;
          }
          // paciente (objeto → cifrar)
          const rawPaciente = data['paciente'];
          if (rawPaciente !== null && typeof rawPaciente === 'object') {
            updates['paciente'] = await this.cryptoService.encryptJson(rawPaciente);
            modified = true;
          }
          // profesional
          const rawProfesional = data['profesional'];
          if (rawProfesional !== null && typeof rawProfesional === 'object') {
            updates['profesional'] = await this.cryptoService.encryptJson(rawProfesional);
            modified = true;
          }
          // diagnosticoGlobal
          const rawDiag = data['diagnosticoGlobal'];
          if (typeof rawDiag === 'string' && rawDiag !== '') {
            const check = await this.cryptoService.decryptJson<string>(rawDiag, '__LEGACY__');
            if (check === '__LEGACY__') {
              updates['diagnosticoGlobal'] = await this.cryptoService.encryptJson(rawDiag);
              modified = true;
            }
          }
          // triangulacion
          const rawTri = data['triangulacion'];
          if (Array.isArray(rawTri)) {
            updates['triangulacion'] = await this.cryptoService.encryptJson(rawTri);
            modified = true;
          }
          // puntajeTotal
          const rawScore = data['puntajeTotal'];
          if (typeof rawScore === 'number') {
            updates['puntajeTotal'] = await this.cryptoService.encryptJson(rawScore);
            modified = true;
          }
          // nivelDepresion
          const rawNivel = data['nivelDepresion'];
          if (typeof rawNivel === 'string' && rawNivel !== '') {
            const checkNivel = await this.cryptoService.decryptJson<string>(rawNivel, '__LEGACY__');
            if (checkNivel === '__LEGACY__') {
              updates['nivelDepresion'] = await this.cryptoService.encryptJson(rawNivel);
              modified = true;
            }
          }
          // patientEmail
          const rawEmail = data['patientEmail'];
          if (typeof rawEmail === 'string' && rawEmail !== '') {
            const check = await this.cryptoService.decryptJson<string>(rawEmail, '__LEGACY__');
            if (check === '__LEGACY__') {
              updates['patientEmail'] = await this.cryptoService.encryptJson(rawEmail);
              modified = true;
            }
          }
          // reevaluadoPor
          const rawReeval = data['reevaluadoPor'];
          if (typeof rawReeval === 'string' && rawReeval !== '') {
            const check = await this.cryptoService.decryptJson<string>(rawReeval, '__LEGACY__');
            if (check === '__LEGACY__') {
              updates['reevaluadoPor'] = await this.cryptoService.encryptJson(rawReeval);
              modified = true;
            }
          }
          // motivoReevaluacion
          const rawMotivo = data['motivoReevaluacion'];
          if (typeof rawMotivo === 'string' && rawMotivo !== '') {
            const check = await this.cryptoService.decryptJson<string>(rawMotivo, '__LEGACY__');
            if (check === '__LEGACY__') {
              updates['motivoReevaluacion'] = await this.cryptoService.encryptJson(rawMotivo);
              modified = true;
            }
          }
        } else if (type === 'paciente') {
          for (const field of this.PACIENTE_PII) {
            const val = data[field];
            if (val === undefined || val === null || val === '') { continue; }
            if (typeof val === 'string') {
              const check = await this.cryptoService.decryptJson<unknown>(val, '__LEGACY__');
              if (check === '__LEGACY__') {
                updates[field] = await this.cryptoService.encryptJson(val);
                modified = true;
              }
            } else {
              // número u otro tipo primitivo sin cifrar
              updates[field] = await this.cryptoService.encryptJson(val);
              modified = true;
            }
          }
        } else if (type === 'psicologo') {
          for (const field of this.PSICOLOGO_PII) {
            const val = data[field];
            if (typeof val !== 'string' || val === '') { continue; }
            const check = await this.cryptoService.decryptJson<string>(val, '__LEGACY__');
            if (check === '__LEGACY__') {
              updates[field] = await this.cryptoService.encryptJson(val);
              modified = true;
            }
          }
        }

        if (modified) {
          await updateDoc(docSnap.ref, updates);
          result.migrated++;
        } else {
          result.skipped++;
        }
      } catch {
        result.errors++;
      }

      done++;
      onProgress?.(done, result.total);
    }

    return result;
  }
}
