"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.scss";
import ProtectedRoute from "@/components/ProtectedRoute";

const cx = classNames.bind(styles);

interface AIAnalysisResult {
    symptomSummary: string;
    possibleCauses: string[];
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    riskExplanation: string;
    recommendedActions: string[];
    redFlags: string[];
    medicalDisclaimer: string;
}

export default function DashboardPage() {
    const [symptoms, setSymptoms] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<AIAnalysisResult | null>(null);
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSymptoms = symptoms.trim();

        if (trimmedSymptoms.length < 5) {
            setErrorMsg("Vui lòng mô tả triệu chứng bằng ít nhất 5 ký tự.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            const response = await api.post("/ai-analysis/analyze", {
                symptoms: trimmedSymptoms,
            });
            setResult(response.data.data);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                setErrorMsg(
                    "AI đang đạt giới hạn sử dụng. Vui lòng thử lại sau ít phút hoặc bật billing cho Gemini API.",
                );
            } else if (status === 503) {
                setErrorMsg(
                    "Hệ thống AI đang quá tải trong giây lát. Vui lòng thử lại sau ít phút.",
                );
            } else if (status === 500) {
                setErrorMsg(
                    err.response?.data?.message ||
                        "Hệ thống phân tích AI đang gặp sự cố. Vui lòng thử lại sau.",
                );
            } else {
                setErrorMsg(
                    err.response?.data?.message ||
                        "Đã có lỗi xảy ra. Vui lòng thử lại.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    <header className={cx("header")}>
                        <h1>HealthShield AI</h1>
                        <div>
                            <span style={{ marginRight: "12px" }}>
                                Xin chào, {user?.fullName || "Người dùng"}
                            </span>
                            <button
                                onClick={() => router.push("/profile")}
                                className={cx("logoutBtn")}
                            >
                                📋 Hồ sơ sức khỏe
                            </button>
                            <button
                                onClick={handleLogout}
                                className={cx("logoutBtn")}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </header>

                    {/* Input Form */}
                    <div className={cx("card")}>
                        <h2>Nhập Triệu Chứng Sức Khỏe</h2>
                        <form onSubmit={handleAnalyze}>
                            <textarea
                                className={cx("textarea")}
                                placeholder="Mô tả chi tiết cảm giác bất thường của bạn (VD: Đau đầu dữ dội, đau ngực, buồn nôn...)"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className={cx("analyzeBtn")}
                                disabled={loading}
                            >
                                {loading
                                    ? "AI đang phân tích y tế..."
                                    : "Phân Tích Ngay"}
                            </button>
                            {errorMsg && <p role="alert">{errorMsg}</p>}
                        </form>
                    </div>

                    {/* Output Result */}
                    {result && (
                        <div
                            className={cx(
                                "card",
                                "resultCard",
                                `resultCard--${result.riskLevel}`,
                            )}
                        >
                            <span
                                className={cx(
                                    "badge",
                                    `badge--${result.riskLevel}`,
                                )}
                            >
                                Mức Độ Rủi Ro: {result.riskLevel}
                            </span>

                            <p>
                                <strong>Tóm tắt:</strong>{" "}
                                {result.symptomSummary}
                            </p>
                            <p>
                                <strong>Giải thích:</strong>{" "}
                                {result.riskExplanation}
                            </p>

                            <div className={cx("sectionTitle")}>
                                Nguyên nhân tiềm năng:
                            </div>
                            <ul className={cx("list")}>
                                {result.possibleCauses.map((cause, i) => (
                                    <li key={i}>{cause}</li>
                                ))}
                            </ul>

                            <div className={cx("sectionTitle")}>
                                Khuyến nghị hành động:
                            </div>
                            <ul className={cx("list")}>
                                {result.recommendedActions.map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>

                            {result.redFlags.length > 0 && (
                                <>
                                    <div
                                        className={cx("sectionTitle")}
                                        style={{ color: "#dc2626" }}
                                    >
                                        🚩 Cảnh báo nguy hiểm (Red Flags):
                                    </div>
                                    <ul className={cx("list")}>
                                        {result.redFlags.map((flag, i) => (
                                            <li
                                                key={i}
                                                style={{ color: "#dc2626" }}
                                            >
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            <div className={cx("disclaimer")}>
                                {result.medicalDisclaimer}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
