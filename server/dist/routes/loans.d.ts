declare const router: import("express-serve-static-core").Router;
declare function checkStudentCanTransact(userId: number): Promise<{
    canTransact: boolean;
    reason?: string;
}>;
export { checkStudentCanTransact };
export default router;
//# sourceMappingURL=loans.d.ts.map