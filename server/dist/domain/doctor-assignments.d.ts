export declare function getClassDoctorRoster(className: string, schoolId: number | null): Promise<{
    doctorIds: number[];
    nonDoctorStudentIds: number[];
}>;
export declare function getDoctorIdsForStudent(studentUserId: number, townClass: string, schoolId: number | null): Promise<number[]>;
//# sourceMappingURL=doctor-assignments.d.ts.map