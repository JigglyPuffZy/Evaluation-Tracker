import type { AppRole } from '../types/user'

export function canImportData(role: AppRole): boolean {
  return role === 'admin' || role === 'staff' || role === 'trainer'
}

export function canDeleteImportBatch(role: AppRole): boolean {
  return role === 'admin' || role === 'staff'
}

export function canClearAllData(role: AppRole): boolean {
  return role === 'admin'
}

export function isReadOnlyRole(role: AppRole): boolean {
  return role === 'viewer'
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'staff':
      return 'Staff'
    case 'trainer':
      return 'Trainer'
    case 'viewer':
      return 'Viewer'
  }
}
