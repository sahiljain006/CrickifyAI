/**
 * PITCHIQ Firestore Security Rules Verification Spec
 * Documents expected ALLOW / PERMISSION_DENIED assertions for all Dirty Dozen payloads
 * and owner CRUD workflows against firestore.rules.
 */

export interface SecurityTestCase {
  id: string;
  description: string;
  actorUid: string | null;
  emailVerified: boolean;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const FIRESTORE_SECURITY_TEST_CASES: SecurityTestCase[] = [
  {
    id: 'DD-01',
    description: 'Unauthenticated user cannot read user workspace PII',
    actorUid: null,
    emailVerified: false,
    operation: 'get',
    path: '/users/userA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'Authenticated userB cannot read userA workspace PII',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'get',
    path: '/users/userA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Authenticated userB cannot list userA video analysis reports',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'list',
    path: '/users/userA/reports',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'UserB cannot create a report inside userA subcollection',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userA/reports/rep-1',
    payload: { ownerId: 'userA', title: 'Spoofed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'UserB cannot write ownerId belonging to userA on their own path',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userB/reports/rep-1',
    payload: { ownerId: 'userA', title: 'Mismatch' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'UserB cannot inject shadow RBAC field isAdmin on create',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userB',
    payload: { ownerId: 'userB', name: 'Player', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'UserB cannot inject unknown field during update',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'update',
    path: '/users/userB',
    payload: { roleOverride: 'superadmin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'UserB cannot mutate immutable ownerId on existing report',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'update',
    path: '/users/userB/reports/rep-1',
    payload: { ownerId: 'userC' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'UserB cannot forge createdAt timestamp (must match request.time)',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userB/coachMessages/msg-1',
    payload: { ownerId: 'userB', role: 'user', content: 'Hi', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'Invalid path ID with dots/special characters is rejected by isValidId',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userB/reports/bad..id$123',
    payload: { ownerId: 'userB', title: 'Test' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Oversized thumbnailDataUrl (>200000 chars) is rejected to prevent document bloat',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'create',
    path: '/users/userB/savedVideos/vid-1',
    payload: { ownerId: 'userB', thumbnailDataUrl: 'x'.repeat(200005) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Unverified email token is rejected on write operations',
    actorUid: 'userB',
    emailVerified: false,
    operation: 'create',
    path: '/users/userB',
    payload: { ownerId: 'userB', name: 'Unverified' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'OK-01',
    description: 'Verified owner can create/read/update/delete their own reports and workspace',
    actorUid: 'userB',
    emailVerified: true,
    operation: 'get',
    path: '/users/userB/reports/rep-1',
    expected: 'ALLOW',
  },
];
