"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames/bind";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.scss";

const cx = classNames.bind(styles);

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", { email, password });
            const { accessToken, user } = response.data.data;
            login(accessToken, user);
            router.push("/dashboard");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Đăng nhập thất bại. Vui lòng thử lại.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx("container")}>
            <div className={cx("card")}>
                <h1>HealthShield AI</h1>
                <p>Hệ thống hỗ trợ phân tích rủi ro sức khỏe</p>

                {error && <div className={cx("error")}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={cx("formGroup")}>
                        <label>Email y tế</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@healthshield.ai"
                            required
                        />
                    </div>

                    <div className={cx("formGroup")}>
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={cx("submitBtn")}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Đăng Nhập"}
                    </button>
                </form>
            </div>
        </div>
    );
}
