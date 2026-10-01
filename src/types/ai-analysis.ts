export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type FollowUpStatus = "IMPROVED" | "UNCHANGED" | "WORSED";

export interface IFollowUp {
    _id?: string;
    status: FollowUpStatus;
    note?: string;
    createdAt: string;
}

export interface AssessmentItem {
    _id: string;
    symptomSummary: string;
    riskLevel: RiskLevel;
    riskExplanation: string;
    possibleCauses: string[];
    recommendedActions: string[];
    redFlags?: string[];
    medicalDisclaimer?: string;
    createdAt: string;
    followUps?: IFollowUp[];
}

export interface AIAnalysisResult {
    _id?: string;
    symptomSummary: string;
    possibleCauses: string[];
    riskLevel: RiskLevel;
    riskExplanation: string;
    recommendedActions: string[];
    redFlags: string[];
    medicalDisclaimer: string;
    createdAt?: string;
    followUps?: IFollowUp[];
}
