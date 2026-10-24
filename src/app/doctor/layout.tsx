"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Import context xác thực của bạn
import styles from "./layout.module.scss"; // Tùy chỉnh SCSS của bạn

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Nếu đã load xong mà không có user, hoặc user không phải DOCTOR -> Đuổi về trang chủ/login
        if (!isLoading && (!user || user.role !== "DOCTOR")) {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role !== "DOCTOR") {
        return (
            <div className={styles.loader}>Đang kiểm tra quyền truy cập...</div>
        );
    }

    return (
        <div className={styles.doctorLayout}>
            <aside className={styles.sidebar}>
                <h2>Phòng Khám AI</h2>
                <nav>
                    <ul>
                        <li
                            className={
                                pathname.startsWith("/doctor/case")
                                    ? styles.active
                                    : undefined
                            }
                        >
                            <Link href="/doctor/case">Ca bệnh chờ khám</Link>
                        </li>
                        <li
                            className={
                                pathname.startsWith("/doctor/history")
                                    ? styles.active
                                    : undefined
                            }
                        >
                            <Link href="/doctor/history">Lịch sử hội chẩn</Link>
                        </li>
                    </ul>
                </nav>
            </aside>
            <main className={styles.mainContent}>{children}</main>
        </div>
    );
}
