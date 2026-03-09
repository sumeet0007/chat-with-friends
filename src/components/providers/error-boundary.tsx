"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        
        // You can log to an error reporting service here
        // Example: Sentry.captureException(error);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Something went wrong
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
                            {this.state.error?.message || "An unexpected error occurred. Please try again."}
                        </p>
                        <div className="flex gap-2 justify-center pt-4">
                            <Button onClick={this.handleReset} variant="default">
                                Try again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                            >
                                Reload page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
