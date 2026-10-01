// Chứa EmergencyCategory
export type EmergencyCategory =
    | "STROKE_FAST"
    | "CARDIAC"
    | "RESPIRATORY"
    | "NEUROLOGICAL_POISON"
    | "TRAUMA_HEMORRHAGE"
    | "SELF_HARM"
    | "GENERAL";

export interface EmergencyActionInfo {
    category?: EmergencyCategory;
    title?: string;
    instructions: string[];
}
