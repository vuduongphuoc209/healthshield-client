export interface PatientInfo {
    _id: string;
    fullName?: string;
    email: string;
}

export interface DoctorInfo {
    _id?: string;
    fullName?: string;
    email?: string;
}

export interface CaseItem {
    _id: string;
    userId: PatientInfo;
    symptoms: string;
    symptomSummary?: string;
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    aiResponse?: {
        summary?: string;
        immediateAdvice?: string[];
        redFlags?: string[];
    };
    createdAt: string;
    status: "PENDING" | "REVIEWED";
    doctorNotes?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: DoctorInfo | null;
}
