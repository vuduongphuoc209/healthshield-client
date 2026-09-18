"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.scss";

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
    const [result, setResult] = useState<AIAnalysisResult | null>(null);
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symptoms.trim()) return;

        setLoading(true);
        try {
            const response = await api.post("/ai-analysis/analyze", {
                symptoms,
            });
            setResult(response.data.data);
        } catch (err: any) {
            alert(
                "Phân tích thất bại: " +
                    (err.response?.data?.message || err.message),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
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
                            <strong>Tóm tắt:</strong> {result.symptomSummary}
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
    );
}
