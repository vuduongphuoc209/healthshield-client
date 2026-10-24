import { api } from "@/lib/axios";

export const doctorApi = {
    getPendingCases: () => {
        return api.get("/doctor/cases?status=PENDING");
    },
    getReviewedCases: () => {
        return api.get("/doctor/cases?status=REVIEWED");
    },
    reviewCase: (analysisId: string, doctorNotes: string) => {
        return api.post(`/doctor/cases/${analysisId}/review`, { doctorNotes });
    },
};
