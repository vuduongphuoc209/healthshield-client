import "@/styles/globals.scss";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
    title: "HealthShield AI - Medical Triage System",
    description: "AI-driven health risk analysis & emergency triage",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
