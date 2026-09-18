"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import styles from "./page.module.scss";
import ProtectedRoute from "@/components/ProtectedRoute";

const cx = classNames.bind(styles);

export default function ProfilePage() {
    const [age, setAge] = useState<number | "">("");
    const [gender, setGender] = useState("MALE");
    const [chronicConditions, setChronicConditions] = useState("");
    const [allergies, setAllergies] = useState("");
    const [currentMedications, setCurrentMedications] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState("");

    const router = useRouter();

    // Lấy dữ liệu hồ sơ hiện tại từ Backend
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/health-profile");
                const profile = response.data.data;
                if (profile) {
                    setAge(profile.age || "");
                    setGender(profile.gender || "MALE");
                    setChronicConditions(
                        profile.chronicConditions?.join(", ") || "",
                    );
                    setAllergies(profile.allergies?.join(", ") || "");
                    setCurrentMedications(
                        profile.currentMedications?.join(", ") || "",
                    );
                }
            } catch {
                // Nếu chưa tạo profile bao giờ thì giữ nguyên form trống
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const payload = {
            age: Number(age),
            gender,
            chronicConditions: chronicConditions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            allergies: allergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            currentMedications: currentMedications
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };

        try {
            await api.put("/health-profile", payload);
            setMessage("Cập nhật hồ sơ sức khỏe thành công!");
        } catch (err: any) {
            alert(
                "Lỗi khi lưu hồ sơ: " +
                    (err.response?.data?.message || err.message),
            );
        } finally {
            setLoading(false);
        }
    };

    if (fetching)
        return <div className={cx("container")}>Đang tải hồ sơ...</div>;

    return (
        <ProtectedRoute>
            <div className={cx("container")}>
                <div className={cx("wrapper")}>
                    <header className={cx("header")}>
                        <h1>Hồ Sơ Sức Khỏe Nền</h1>
                        <button
                            className={cx("backBtn")}
                            onClick={() => router.push("/dashboard")}
                        >
                            ← Quay lại Dashboard
                        </button>
                    </header>

                    <div className={cx("card")}>
                        {message && (
                            <div className={cx("successMsg")}>{message}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className={cx("formGrid")}>
                                <div className={cx("formGroup")}>
                                    <label>Tuổi</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) =>
                                            setAge(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : "",
                                            )
                                        }
                                        placeholder="VD: 28"
                                        required
                                    />
                                </div>

                                <div className={cx("formGroup")}>
                                    <label>Giới tính</label>
                                    <select
                                        value={gender}
                                        onChange={(e) =>
                                            setGender(e.target.value)
                                        }
                                    >
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </div>
                            </div>

                            <div className={cx("formGroup")}>
                                <label>
                                    Bệnh mãn tính / Tiền sử bệnh (ngăn cách bằng
                                    dấu phẩy)
                                </label>
                                <textarea
                                    value={chronicConditions}
                                    onChange={(e) =>
                                        setChronicConditions(e.target.value)
                                    }
                                    placeholder="VD: Cao huyết áp, Tiểu đường tuýp 2, Hen suyễn..."
                                />
                            </div>

                            <div className={cx("formGroup")}>
                                <label>Dị ứng (ngăn cách bằng dấu phẩy)</label>
                                <textarea
                                    value={allergies}
                                    onChange={(e) =>
                                        setAllergies(e.target.value)
                                    }
                                    placeholder="VD: Dị ứng Penicillin, Hải sản, Phấn hoa..."
                                />
                            </div>

                            <div className={cx("formGroup")}>
                                <label>
                                    Thuốc đang sử dụng (ngăn cách bằng dấu phẩy)
                                </label>
                                <textarea
                                    value={currentMedications}
                                    onChange={(e) =>
                                        setCurrentMedications(e.target.value)
                                    }
                                    placeholder="VD: Paracetamol 500mg, Metformin..."
                                />
                            </div>

                            <button
                                type="submit"
                                className={cx("saveBtn")}
                                disabled={loading}
                            >
                                {loading ? "Đang lưu..." : "Lưu Hồ Sơ Sức Khỏe"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
