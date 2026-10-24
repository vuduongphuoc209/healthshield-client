"use client";

import { useEffect, useState } from "react";
import { doctorApi } from "@/lib/api/doctor.api";
import styles from "./page.module.scss";
import type { CaseItem } from "@/types/doctor-case";
import Link from "next/dist/client/link";
import classNames from "classnames/bind";

export default function DoctorCasesPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
    const [doctorNotes, setDoctorNotes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const cx = classNames.bind(styles);

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const res = await doctorApi.getPendingCases();
            const caseList = res.data.data || [];
            setCases(caseList);
            if (caseList.length > 0) {
                setSelectedCase(caseList[0]);
            } else {
                setSelectedCase(null);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách ca bệnh:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCase || !doctorNotes.trim()) return;

        try {
            setIsSubmitting(true);
            setMessage(null);
            await doctorApi.reviewCase(selectedCase._id, doctorNotes.trim());

            setMessage({
                type: "success",
                text: "Đã gửi đánh giá chuyên môn thành công!",
            });
            setDoctorNotes("");

            // Cập nhật lại danh sách ca bệnh chờ khám
            await fetchCases();
        } catch (error: any) {
            const errorMsg =
                error.response?.data?.message || "Gửi đánh giá thất bại.";
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={cx("loading")}>Đang tải danh sách ca bệnh...</div>
        );
    }

    return (
        <div className={cx("container")}>
            <header className={cx("header")}>
                <h2>Danh sách ca bệnh cần xem xét ({cases.length})</h2>
                <Link href="/dashboard" className={cx("navLink")}>
                    ← Quay lại Dashboard
                </Link>
            </header>

            {message && (
                <div
                    className={
                        message.type === "success"
                            ? cx("alertSuccess")
                            : cx("alertError")
                    }
                >
                    {message.text}
                </div>
            )}

            {cases.length === 0 ? (
                <div className={cx("emptyState")}>
                    <p>Hiện không có ca bệnh nào đang chờ xem xét.</p>
                </div>
            ) : (
                <div className={cx("workspace")}>
                    {/* CỘT DANH SÁCH CA BỆNH */}
                    <div className={cx("caseList")}>
                        {cases.map((item) => {
                            const isSelected = selectedCase?._id === item._id;
                            return (
                                <div
                                    key={item._id}
                                    className={`${cx("caseCard")} ${isSelected ? cx("selected") : ""}`}
                                    onClick={() => {
                                        setSelectedCase(item);
                                        setDoctorNotes("");
                                        setMessage(null);
                                    }}
                                >
                                    <div className={cx("cardHeader")}>
                                        <span className={cx("patientName")}>
                                            {item.userId?.fullName ||
                                                item.userId?.email ||
                                                "Bệnh nhân"}
                                        </span>
                                        <span
                                            className={`${cx("riskBadge")} ${cx(item.riskLevel.toLowerCase())}`}
                                        >
                                            {item.riskLevel}
                                        </span>
                                    </div>
                                    <p className={cx("symptomsPreview")}>
                                        {item.symptoms}
                                    </p>
                                    <small className={cx("date")}>
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleString("vi-VN")}
                                    </small>
                                </div>
                            );
                        })}
                    </div>

                    {/* CỘT CHI TIẾT VÀ FORM HỘI CHẨN */}
                    {selectedCase && (
                        <div className={cx("detailPane")}>
                            <section className={cx("section")}>
                                <h3>Thông tin ca bệnh</h3>
                                <p>
                                    <strong>Bệnh nhân:</strong>{" "}
                                    {selectedCase.userId?.fullName ||
                                        "Chưa cập nhật"}{" "}
                                    ({selectedCase.userId?.email})
                                </p>
                                <p>
                                    <strong>Triệu chứng mô tả:</strong>{" "}
                                    {selectedCase.symptoms}
                                </p>
                                <p>
                                    <strong>Mức độ rủi ro sơ bộ:</strong>{" "}
                                    {selectedCase.riskLevel}
                                </p>
                            </section>

                            {selectedCase.aiResponse && (
                                <section className={cx("section")}>
                                    <h3>Đánh giá từ AI</h3>
                                    <p>{selectedCase.aiResponse.summary}</p>
                                    {selectedCase.aiResponse.redFlags &&
                                        selectedCase.aiResponse.redFlags
                                            .length > 0 && (
                                            <div className={cx("redFlags")}>
                                                <strong>
                                                    Dấu hiệu cảnh báo:
                                                </strong>
                                                <ul>
                                                    {selectedCase.aiResponse.redFlags.map(
                                                        (flag, idx) => (
                                                            <li key={idx}>
                                                                {flag}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                </section>
                            )}

                            <form
                                onSubmit={handleReviewSubmit}
                                className={cx("reviewForm")}
                            >
                                <h3>Ý kiến chuyên môn của Bác sĩ</h3>
                                <textarea
                                    rows={4}
                                    placeholder="Nhập nhận định lâm sàng, hướng dẫn theo dõi hoặc đơn thuốc đề xuất..."
                                    value={doctorNotes}
                                    onChange={(e) =>
                                        setDoctorNotes(e.target.value)
                                    }
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting || !doctorNotes.trim()
                                    }
                                >
                                    {isSubmitting
                                        ? "Đang lưu..."
                                        : "Xác nhận & Gửi ý kiến"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
