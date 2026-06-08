import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { firestoreDb } from '../config/firebase.app';
import { CryptoService } from './crypto.service';

export const AVAILABLE_TESTS: { id: string; nombre: string }[] = [
  { id: 'BDI-II', nombre: 'Inventario de Depresión de Beck (BDI-II)' },
  { id: 'BAI', nombre: 'Inventario de Ansiedad de Beck (BAI)' },
  { id: 'IHL', nombre: 'Inventario de Hostigamiento Laboral (IHL)' }
];

export interface PacienteProfile {
  uid: string;
  email: string;
  nombreApellidos: string;
  patientKey: string;
  estadoCivil: string;
  edad: number | null;
  sexo: string;
  ocupacion: string;
  educacion: string;
  psicologoEmail: string;
  psicologoNombre: string;
  testsHabilitados: string[];
  creadoEn: string;
}

export interface PsicologoProfile {
  nombre: string;
  email: string;
  matricula: string;
  codigoAcceso: string;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class PacienteProfileService {
  private readonly pacientesCol = 'pacientes';
  private readonly psicologosCol = 'psicologos';

  // Campos de PacienteProfile que se cifran (el resto son llaves de query o metadata)
  private readonly PACIENTE_PII = [
    'nombreApellidos', 'email', 'estadoCivil', 'edad', 'sexo', 'ocupacion', 'educacion', 'psicologoNombre'
  ] as const;

  // Campos de PsicologoProfile que se cifran
  private readonly PSICOLOGO_PII = ['nombre', 'matricula', 'email'] as const;

  constructor(private readonly crypto: CryptoService) {}

  private async encryptPaciente(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const out = { ...data };
    for (const field of this.PACIENTE_PII) {
      if (data[field] !== undefined && data[field] !== null) {
        out[field] = await this.crypto.encryptJson(data[field]);
      }
    }
    return out;
  }

  private async decryptPaciente(raw: Record<string, unknown>): Promise<PacienteProfile> {
    const out = { ...raw } as Record<string, unknown>;
    for (const field of this.PACIENTE_PII) {
      const val = raw[field];
      if (typeof val === 'string' && val !== '') {
        out[field] = await this.crypto.decryptJson(val, val);
      }
    }
    return out as unknown as PacienteProfile;
  }

  private async encryptPsicologo(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const out = { ...data };
    for (const field of this.PSICOLOGO_PII) {
      if (data[field] !== undefined && data[field] !== null) {
        out[field] = await this.crypto.encryptJson(data[field]);
      }
    }
    return out;
  }

  private async decryptPsicologo(raw: Record<string, unknown>): Promise<PsicologoProfile> {
    const out = { ...raw } as Record<string, unknown>;
    for (const field of this.PSICOLOGO_PII) {
      const val = raw[field];
      if (typeof val === 'string' && val !== '') {
        out[field] = await this.crypto.decryptJson(val, val);
      }
    }
    // Restaurar el código original desde el campo cifrado
    const encCodigo = raw['codigoAccesoEnc'];
    if (typeof encCodigo === 'string' && encCodigo !== '') {
      out['codigoAcceso'] = await this.crypto.decryptJson(encCodigo, out['codigoAcceso']);
    }
    return out as unknown as PsicologoProfile;
  }

  async getPsicologoByCodigo(codigo: string): Promise<PsicologoProfile | null> {
    const q = query(
      collection(firestoreDb, this.psicologosCol),
      where('codigoAcceso', '==', await this.crypto.hmac(codigo.trim().toUpperCase()))
    );
    const snap = await getDocs(q);
    if (snap.empty) { return null; }
    return this.decryptPsicologo(snap.docs[0].data() as Record<string, unknown>);
  }

  async getPsicologoByEmail(email: string): Promise<PsicologoProfile | null> {
    const docId = await this.crypto.hmac(email.trim().toLowerCase());
    const snap = await getDoc(doc(firestoreDb, this.psicologosCol, docId));
    if (!snap.exists()) { return null; }
    return this.decryptPsicologo(snap.data() as Record<string, unknown>);
  }

  async createProfile(uid: string, data: Omit<PacienteProfile, 'uid' | 'patientKey'>): Promise<void> {
    const patientKey = await this.crypto.hmac(data.nombreApellidos.trim().toLowerCase());
    const psicologoEmailHash = await this.crypto.hmac(data.psicologoEmail.trim().toLowerCase());
    const toStore = await this.encryptPaciente({ ...data, uid, patientKey } as unknown as Record<string, unknown>);
    toStore['patientKey'] = patientKey;
    toStore['uid'] = uid;
    toStore['psicologoEmail'] = psicologoEmailHash;
    toStore['testsHabilitados'] = data.testsHabilitados;
    toStore['creadoEn'] = data.creadoEn;
    await setDoc(doc(firestoreDb, this.pacientesCol, uid), toStore);
  }

  async getProfile(uid: string): Promise<PacienteProfile | null> {
    const snap = await getDoc(doc(firestoreDb, this.pacientesCol, uid));
    if (!snap.exists()) { return null; }
    return this.decryptPaciente(snap.data() as Record<string, unknown>);
  }

  async getProfileByPatientKey(patientKeyHash: string): Promise<PacienteProfile | null> {
    const q = query(
      collection(firestoreDb, this.pacientesCol),
      where('patientKey', '==', patientKeyHash)
    );
    const snap = await getDocs(q);
    if (snap.empty) { return null; }
    return this.decryptPaciente(snap.docs[0].data() as Record<string, unknown>);
  }

  async updateTestsHabilitados(uid: string, tests: string[]): Promise<void> {
    await updateDoc(doc(firestoreDb, this.pacientesCol, uid), { testsHabilitados: tests });
  }

  async searchPatientsByName(name: string, psicologoEmail: string): Promise<PacienteProfile[]> {
    const term = name.trim().toLowerCase();
    const emailHash = await this.crypto.hmac(psicologoEmail.trim().toLowerCase());
    const q = query(
      collection(firestoreDb, this.pacientesCol),
      where('psicologoEmail', '==', emailHash)
    );
    const snap = await getDocs(q);
    const decrypted = await Promise.all(
      snap.docs
        .map((d) => d.data() as Record<string, unknown>)
        .map((d) => this.decryptPaciente(d))
    );
    return decrypted.filter((p) => !term || p.nombreApellidos.toLowerCase().includes(term));
  }

  async psicologoEmailExists(email: string): Promise<boolean> {
    const docId = await this.crypto.hmac(email.trim().toLowerCase());
    const snap = await getDoc(doc(firestoreDb, this.psicologosCol, docId));
    return snap.exists();
  }

  async createPsicologoProfile(data: Omit<PsicologoProfile, 'codigoAcceso' | 'creadoEn'>): Promise<PsicologoProfile> {
    const codigo = await this.generateCodigoUnico(data.nombre);
    const profile: PsicologoProfile = {
      ...data,
      email: data.email.trim().toLowerCase(),
      codigoAcceso: codigo,
      creadoEn: new Date().toISOString()
    };
    const docId = await this.crypto.hmac(profile.email);
    const toStore = await this.encryptPsicologo(profile as unknown as Record<string, unknown>);
    toStore['codigoAcceso'] = await this.crypto.hmac(codigo);       // HMAC para queries
    toStore['codigoAccesoEnc'] = await this.crypto.encryptJson(codigo); // AES para mostrar
    toStore['creadoEn'] = profile.creadoEn;
    await setDoc(doc(firestoreDb, this.psicologosCol, docId), toStore);
    return profile;
  }

  private async generateCodigoUnico(nombre: string): Promise<string> {
    const parts = nombre.trim().toUpperCase().split(/\s+/);
    const base = parts
      .map((p) => p.charAt(0))
      .join('')
      .slice(0, 3)
      .padEnd(3, 'X');

    for (let attempt = 0; attempt < 20; attempt++) {
      const digits = Math.floor(100 + Math.random() * 900).toString();
      const codigo = `${base}${digits}`;
      const q = query(
        collection(firestoreDb, this.psicologosCol),
        where('codigoAcceso', '==', await this.crypto.hmac(codigo))
      );
      const snap = await getDocs(q);
      if (snap.empty) { return codigo; }
    }

    // Fallback: 6 chars aleatorios si hubo colisiones
    return Math.random().toString(36).toUpperCase().slice(2, 8);
  }
}
