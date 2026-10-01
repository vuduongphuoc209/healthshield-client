export interface BloodPressure {
    systolic?: number;
    diastolic?: number;
}

export interface PatientVitals {
    biologicalSex?: "MALE" | "FEMALE" | string;
    bloodType?: string;
    heightCm?: number;
    weightKg?: number;
    bloodPressure?: BloodPressure;
    preExistingConditions?: string[];
}
