# PITCHIQ Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every personal document lives inside `/users/{userId}` or a subcollection directly under `/users/{userId}`. Only the authenticated, email-verified user whose `request.auth.uid == userId` AND whose document `ownerId == request.auth.uid` can read, list, create, update, or delete any record.
2. **Master Gate Relational Integrity**: Subcollection documents (`/reports`, `/savedVideos`, `/coachMessages`, `/trainingPlans`, `/trainingHistory`, `/matchAnalyses`, `/squadPlayers`) cannot exist without an existing parent `/users/{userId}` workspace document (`exists(/databases/$(database)/documents/users/$(userId))`).
3. **Immutable Ownership & Creation Timestamps**: `ownerId` and `createdAt` must equal `request.auth.uid` and `request.time` respectively on `create`, and must never change on `update`. `updatedAt` must always equal `request.time` on both `create` and `update`.
4. **No Raw Video or Unbounded Payloads**: Arrays are strictly bounded (`frames <= 8`, `goals <= 12`, `completedLessonIds <= 200`, `coachMessages` stored as individual docs, `thumbnailDataUrl <= 200000` chars).
5. **Path Variable Hardening & Strict Field Allowlisting**: All document IDs (`userId`, `reportId`, `videoId`, `messageId`, `planId`, `entryId`, `matchId`, `playerId`) must match `^[a-zA-Z0-9_\-]+$` and stay `<= 128` characters. Both `create` (`hasAll` + `hasOnly`) and `update` (`affectedKeys().hasOnly(...)`) reject unapproved shadow fields.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Workspace Read**: `GET /users/userA` with `auth = null`.
2. **Cross-User Profile Read (PII Leak)**: `GET /users/userA` as `userB`.
3. **Cross-User Subcollection List**: `LIST /users/userA/reports` as `userB`.
4. **Identity Spoofing on Create**: `CREATE /users/userA/reports/rep-1` as `userB` with `ownerId: "userA"`.
5. **Body Owner Mismatch on Own Path**: `CREATE /users/userB/reports/rep-1` as `userB` with `ownerId: "userA"`.
6. **Shadow Field Injection on Create**: `CREATE /users/userB` as `userB` including extra `"isAdmin": true` ghost field.
7. **Shadow Field Injection on Update**: `UPDATE /users/userB` as `userB` adding `"roleOverride": "superadmin"`.
8. **Immutable Owner Tampering on Update**: `UPDATE /users/userB/reports/rep-1` changing `ownerId` from `"userB"` to `"userC"`.
9. **Client Timestamp Forgery**: `CREATE /users/userB/coachMessages/msg-1` with `createdAt` set to a forged past timestamp instead of `request.time`.
10. **Path ID Poisoning**: `CREATE /users/userB/reports/bad..id$123` containing disallowed characters.
11. **Oversized Video / String Exhaustion**: `CREATE /users/userB/savedVideos/vid-1` with `thumbnailDataUrl` exceeding 200,000 characters.
12. **Unverified Email Token Spoof**: `CREATE /users/userB` with `auth.uid == "userB"` and `auth.token.email_verified == false`.
