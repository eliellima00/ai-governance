import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SolutionProject } from '../types';
import { GovernanceSettings } from '../config/governanceConfig';
import { PORTAL_LOGISTICA_PROJECT, BOT_WHATSAPP_PROJECT } from '../data/portalLogisticaData';

// Inicialização do Firebase App
export const app = initializeApp(firebaseConfig);

// Inicialização do Firestore com Database ID específico
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Inicialização do Firebase Auth
export const auth = getAuth(app);

// Tipos de operações Firestore para tratamento padronizado de erros
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    isAnonymous: boolean;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      isAnonymous: currentUser?.isAnonymous || false,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Remove recursivamente todas as propriedades com valor `undefined`
 * para compatibilidade estrita com o Firestore.
 * O Firestore rejeita qualquer documento que contenha valores `undefined` em qualquer nível de aninhamento.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) {
      return data;
    }
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitizedObj[key] = sanitizeForFirestore(value);
      }
    }
    return sanitizedObj as T;
  }
  return data;
}

/**
 * Testa a conexão com o banco de dados Firestore
 */
export async function testConnection(): Promise<boolean> {
  try {
    const testCol = collection(db, 'test');
    await getDocs(testCol);
    return true;
  } catch (error) {
    console.warn('Falha na checagem de teste Firestore:', error);
    // Tenta ler projetos
    try {
      await getDocs(collection(db, 'projects'));
      return true;
    } catch (innerError) {
      console.error('Erro de conexão Firestore:', innerError);
      return false;
    }
  }
}

// Os dois projetos oficiais solicitados pelo usuário
export const ALLOWED_INITIAL_PROJECTS: SolutionProject[] = [
  PORTAL_LOGISTICA_PROJECT,
  BOT_WHATSAPP_PROJECT
];

export const ALLOWED_PROJECT_IDS = new Set(ALLOWED_INITIAL_PROJECTS.map((p) => p.id));

/**
 * Garante que apenas os projetos especificados estejam salvos no Firestore
 */
export async function ensureAllowedProjectsInFirestore(): Promise<SolutionProject[]> {
  try {
    const projectsCol = collection(db, 'projects');
    const snapshot = await getDocs(projectsCol);

    const batch = writeBatch(db);
    let modificationsNeeded = false;
    const existingMap = new Map<string, SolutionProject>();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as SolutionProject;
      // Se não for um dos projetos permitidos, remove do banco para cumprir a instrução do usuário
      if (!ALLOWED_PROJECT_IDS.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        modificationsNeeded = true;
      } else {
        existingMap.set(docSnap.id, data);
      }
    });

    // Garante que ambos os projetos estejam salvos no Firestore
    for (const p of ALLOWED_INITIAL_PROJECTS) {
      if (!existingMap.has(p.id)) {
        const docRef = doc(db, 'projects', p.id);
        batch.set(docRef, sanitizeForFirestore(p));
        existingMap.set(p.id, p);
        modificationsNeeded = true;
      }
    }

    if (modificationsNeeded) {
      await batch.commit();
    }

    return Array.from(existingMap.values());
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'projects');
  }
}

/**
 * Salva ou atualiza um projeto específico no Firestore
 */
export async function saveProjectToFirestore(project: SolutionProject): Promise<void> {
  try {
    const docRef = doc(db, 'projects', project.id);
    const sanitized = sanitizeForFirestore(project);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}

/**
 * Deleta um projeto do Firestore
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}

/**
 * Escuta atualizações em tempo real da coleção de projetos
 */
export function subscribeToProjects(
  onUpdate: (projects: SolutionProject[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const projectsCol = collection(db, 'projects');
  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const list: SolutionProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SolutionProject;
        list.push({ ...data, id: docSnap.id });
      });

      // Ordena garantindo os projetos principais primeiro
      list.sort((a, b) => {
        if (a.id === 'portal-logistica-atto') return -1;
        if (b.id === 'portal-logistica-atto') return 1;
        if (a.id === 'bot-whatsapp-logistica-notificacoes') return -1;
        if (b.id === 'bot-whatsapp-logistica-notificacoes') return 1;
        return a.name.localeCompare(b.name);
      });

      onUpdate(list);
    },
    (err) => {
      console.error('Erro no listener de projetos do Firestore:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Salva as configurações globais de governança no Firestore
 */
export async function saveSettingsToFirestore(settings: GovernanceSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'governance');
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/governance');
  }
}

/**
 * Carrega as configurações globais de governança do Firestore
 */
export async function fetchSettingsFromFirestore(): Promise<GovernanceSettings | null> {
  try {
    const docRef = doc(db, 'settings', 'governance');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as GovernanceSettings;
    }
    return null;
  } catch (err) {
    console.warn('Configurações não encontradas no Firestore, usando padrão:', err);
    return null;
  }
}
