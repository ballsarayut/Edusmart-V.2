# Security Specification - EduSmart Vocational CMS

## Data Invariants
1.  **Students**: Only ADMIN and ACADEMIC can create/delete students. TEACHER can read all. PARENT can only read their own student.
2.  **Attendance**: Only TEACHER and ADMIN can create/update. PARENT can read their student's attendance.
3.  **Behavior**: Only TEACHER and ADMIN can record behavior. PARENT can read their student's records.
4.  **News**: ADMIN and ACADEMIC can post news. All can read.
5.  **Users**: ADMIN can manage all users. Users can read their own profile.
6.  **Tuition**: Only FINANCE and ADMIN can manage. PARENT can read their student's payment history.
7.  **Jobs**: COMPANY and ADMIN can manage jobs. All can read.
8.  **Config**: Only ADMIN can modify system config.

## The Dirty Dozen Payloads (Total System Failure candidates)

1.  **Identity Spoofing (Student)**: A TEACHER trying to change a student's `behaviorScore` directly without a behavior record (if we enforced it, but here it's likely updated in flow). Let's say: A PARENT trying to update their student's behavior score.
    *   `payload`: `{ behaviorScore: 100 }` on `/students/S1` by user `P1`.
2.  **Role Escalation**: A TEACHER trying to change their own role to `ADMIN`.
    *   `payload`: `{ role: 'ADMIN' }` on `/users/T1`.
3.  **Unauthorized News**: A PARENT trying to post news.
    *   `payload`: `{ title: 'Fake News', authorName: 'Parent' ... }` on `/news/N999`.
4.  **Ghost Field Attack**: An ADMIN adding a `hiddenAdmin: true` field to a student record.
    *   `payload`: `{ ...validFields, hiddenAdmin: true }`.
5.  **Resource Poisoning**: Sending a 1MB string for a student name.
6.  **Terminal State Shortcut**: Setting a payment status to `PAID` without the required admin/finance role.
7.  **Orphaned Attendance**: Creating attendance for a non-existent student (if we use `exists()`).
8.  **ID Poisoning**: Using a 2KB string as a document ID for a new student.
9.  **Timestamp Spoofing**: Setting `timestamp` to a date in the future instead of `serverTimestamp()`.
10. **Unauthorized PII Read**: A student trying to read another student's detailed record (if restricted).
11. **Job Hijacking**: A TEACHER trying to delete a job posted by a COMPANY.
12. **Config Sabotage**: A student trying to change the `morningTimeLimit`.

## Test Scenarios (Verification)
-   `PERMISSION_DENIED` for all Dirty Dozen.
-   `SUCCESS` for TEACHER recording attendance.
-   `SUCCESS` for ADMIN managing users.
-   `SUCCESS` for STUDENT/PARENT reading their own notifications.
