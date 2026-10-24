"use client";

import { useEffect, useState } from "react";
import { doctorApi } from "@/lib/api/doctor.api";
import type { CaseItem } from "@/types/doctor-case";
import styles from "../case/page.module.scss";
import Link from "next/dist/client/link";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

export default function DoctorHistoryPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const loadReviewedCases = async () => {
            try {
                const response = await doctorApi.getReviewedCases();
                const reviewedCases: CaseItem[] = response.data?.data ?? [];
                setCases(reviewedCases);
                setSelectedCase(reviewedCases[0] ?? null);
            } catch (error: any) {
                setErrorMessage(
                    error.response?.data?.message ||
                        "Không thể tải lịch sử hội chẩn.",
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadReviewedCases();
    }, []);

    if (isLoading) {
        return (
            <div className={cx("container")}>
                <div className={cx("loading")}>
                    Đang tải lịch sử hội chẩn...
                </div>
            </div>
        );
    }

    return (
        <div className={cx("container")}>
            <header className={cx("header")}>
                <h2>Lịch sử hội chẩn ({cases.length})</h2>
                <Link href="/dashboard" className={cx("navLink")}>
                    ← Quay lại Dashboard
                </Link>
            </header>

            {errorMessage ? (
                <div className={cx("alertError")}>{errorMessage}</div>
            ) : cases.length === 0 ? (
                <div className={cx("emptyState")}>
                    <p>Chưa có ca bệnh nào được bác sĩ thẩm định.</p>
                </div>
            ) : (
                <div className={cx("workspace")}>
                    <div className={cx("caseList")}>
                        {cases.map((item) => (
                            <button
                                type="button"
                                key={item._id}
                                className={`${cx("caseCard")} ${selectedCase?._id === item._id ? cx("selected") : ""}`}
                                onClick={() => setSelectedCase(item)}
                            >
                                <span className={cx("cardHeader")}>
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
                                </span>
                                <span className={cx("symptomsPreview")}>
                                    {item.symptomSummary || item.symptoms}
                                </span>
                                <span className={cx("date")}>
                                    Thẩm định:{" "}
                                    {item.reviewedAt
                                        ? new Date(
                                              item.reviewedAt,
                                          ).toLocaleDateString("vi-VN")
                                        : "Chưa cập nhật"}
                                </span>
                            </button>
                        ))}
                    </div>

                    {selectedCase && (
                        <article className={cx("detailPane")}>
                            <section className={cx("section")}>
                                <h3>Thông tin ca bệnh</h3>
                                <p>
                                    <strong>Bệnh nhân:</strong>{" "}
                                    {selectedCase.userId?.fullName ||
                                        "Chưa cập nhật"}
                                    {selectedCase.userId?.email &&
                                        ` (${selectedCase.userId.email})`}
                                </p>
                                <p>
                                    <strong>Triệu chứng:</strong>{" "}
                                    {selectedCase.symptomSummary ||
                                        selectedCase.symptoms}
                                </p>
                                <p>
                                    <strong>Mức độ rủi ro:</strong>{" "}
                                    {selectedCase.riskLevel}
                                </p>
                                <p>
                                    <strong>Ngày tiếp nhận:</strong>{" "}
                                    {new Date(
                                        selectedCase.createdAt,
                                    ).toLocaleString("vi-VN")}
                                </p>
                            </section>

                            <section className={cx("reviewedNote")}>
                                <span className={cx("reviewedBadge")}>
                                    Đã được Bác sĩ thẩm định
                                </span>
                                <h3>Ý kiến chuyên môn của Bác sĩ</h3>
                                <p>
                                    {selectedCase.doctorNotes ||
                                        "Chưa có nội dung ghi chú."}
                                </p>
                                <div className={cx("reviewMeta")}>
                                    <span>
                                        Bác sĩ phụ trách:{" "}
                                        {selectedCase.reviewedBy?.fullName ||
                                            "Bác sĩ"}
                                    </span>
                                    <span>
                                        Ngày thẩm định:{" "}
                                        {selectedCase.reviewedAt
                                            ? new Date(
                                                  selectedCase.reviewedAt,
                                              ).toLocaleString("vi-VN")
                                            : "Chưa cập nhật"}
                                    </span>
                                </div>
                            </section>
                        </article>
                    )}
                </div>
            )}
        </div>
    );
}
