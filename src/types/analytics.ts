// src/types/analytics.ts

export interface RiskDistribution {
    LOW: number;
    MODERATE: number;
    HIGH: number;
    CRITICAL: number;
}

export interface FollowUpOutcomeStats {
    totalFollowUps: number;
    improvedCount: number;
    unchangedCount: number;
    worsenedCount: number;
    recoveryRatePercent: number;
}

export interface TimelineDataPoint {
    id: string;
    date: string;
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    symptomSummary: string;
}

export interface CurrentVitalsSummary {
    bmi: number | null;
    bmiCategory: string;
    bloodPressure: {
        systolic: number | null;
        diastolic: number | null;
    } | null;
    bloodType: string;
    weightKg: number | null;
    heightCm: number | null;
}

export interface HealthAnalyticsOverview {
    summary: {
        totalAssessments: number;
        criticalAlertsCount: number;
        totalFollowUps: number;
        healthStabilityScore: number;
    };
    riskDistribution: RiskDistribution;
    followUpStats: FollowUpOutcomeStats;
    recentTimeline: TimelineDataPoint[];
    currentVitals: CurrentVitalsSummary;
}
