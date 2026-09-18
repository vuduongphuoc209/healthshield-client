"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/axios";

interface User {
    id: string;
    email: string;
    fullName: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const response = await api.get("/auth/me");
                    setUser(response.data.data.user);
                } catch {
                    localStorage.removeItem("accessToken");
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("accessToken", token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
