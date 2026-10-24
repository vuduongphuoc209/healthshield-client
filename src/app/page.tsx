"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.scss";

export default function HomePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace(
                user.role === "DOCTOR" ? "/doctor/case" : "/dashboard",
            );
        }
    }, [isLoading, router, user]);

    if (isLoading || user) {
        return (
            <main className={styles.loadingScreen}>
                <span className={styles.brandMark} aria-hidden="true">
                    H
                </span>
                <p>Đang mở không gian HealthShield của bạn...</p>
            </main>
        );
    }

    return (
        <main className={styles.homePage}>
            <header className={styles.topBar}>
                <Link
                    className={styles.brand}
                    href="/"
                    aria-label="HealthShield AI, trang chủ"
                >
                    <span className={styles.brandMark} aria-hidden="true">
                        H
                    </span>
                    <span className={styles.brandName}>HealthShield</span>
                    <span className={styles.brandSuffix}>AI</span>
                </Link>

                <nav className={styles.topNav} aria-label="Điều hướng chính">
                    <a href="#how-it-works">Cách hoạt động</a>
                    <Link className={styles.loginLink} href="/login">
                        Đăng nhập
                    </Link>
                </nav>
            </header>

            <section className={styles.hero} aria-labelledby="hero-title">
                <img
                    className={styles.heroImage}
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2400&q=85"
                    alt="Nhân viên y tế đang trao đổi thông tin chăm sóc sức khỏe"
                    fetchPriority="high"
                />
                <div className={styles.heroShade} aria-hidden="true" />

                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>
                        SỨC KHỎE RÕ RÀNG HƠN, TỪ BƯỚC ĐẦU TIÊN
                    </p>
                    <h1 id="hero-title">HealthShield AI</h1>
                    <p className={styles.heroCopy}>
                        Lắng nghe cơ thể. Hiểu điều cần làm tiếp theo.
                    </p>
                    <p className={styles.heroDescription}>
                        Phân tích triệu chứng, theo dõi diễn tiến và chuẩn bị
                        thông tin hữu ích để trao đổi với bác sĩ. Một công cụ hỗ
                        trợ định hướng ban đầu, không thay thế chẩn đoán y khoa.
                    </p>

                    <div className={styles.heroActions}>
                        <Link className={styles.primaryAction} href="/login">
                            Bắt đầu đánh giá
                            <span aria-hidden="true">&#8594;</span>
                        </Link>
                        <a
                            className={styles.secondaryAction}
                            href="#how-it-works"
                        >
                            Khám phá HealthShield
                        </a>
                    </div>

                    <div className={styles.heroFootnote}>
                        <span className={styles.statusDot} aria-hidden="true" />
                        Hỗ trợ nhận biết dấu hiệu cần được chăm sóc kịp thời
                    </div>
                </div>

                <div className={styles.heroIndex} aria-hidden="true">
                    <span>01</span>
                    <span className={styles.heroIndexLine} />
                    <span>03</span>
                </div>
            </section>

            <section
                className={styles.workflow}
                id="how-it-works"
                aria-labelledby="workflow-title"
            >
                <div className={styles.workflowIntro}>
                    <p className={styles.sectionEyebrow}>
                        BẮT ĐẦU TỪ ĐIỀU BẠN CẢM NHẬN
                    </p>
                    <h2 id="workflow-title">
                        Một bước nhỏ để chăm sóc chủ động hơn.
                    </h2>
                </div>

                <div className={styles.steps}>
                    <article className={styles.step}>
                        <span className={styles.stepNumber}>01</span>
                        <h3>Mô tả triệu chứng</h3>
                        <p>
                            Chia sẻ những thay đổi sức khỏe bạn đang gặp phải.
                        </p>
                    </article>
                    <article className={styles.step}>
                        <span className={styles.stepNumber}>02</span>
                        <h3>Nhận định ban đầu</h3>
                        <p>Xem mức độ rủi ro và hướng dẫn an toàn phù hợp.</p>
                    </article>
                    <article className={styles.step}>
                        <span className={styles.stepNumber}>03</span>
                        <h3>Theo dõi cùng bác sĩ</h3>
                        <p>
                            Lưu diễn tiến và xem lại ý kiến chuyên môn khi có.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}
