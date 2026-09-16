"use client";

import { useEffect, useState } from "react";

export function BackgroundLayer() {
    const [videoFailed, setVideoFailed] = useState(false);

    useEffect(() => {
        const video = document.querySelector<HTMLVideoElement>(
            "[data-unclutter-background-video]"
        );

        if (!video) return;

        const handleError = () => setVideoFailed(true);

        video.addEventListener("error", handleError);

        return () => {
            video.removeEventListener("error", handleError);
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-[#FAF9F6]"
        >
            {/* Static background — mobile and fallback */}
            <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat md:hidden"
                style={{
                    backgroundImage: "url('/backgrounds/unclutter-bg.png')",
                }}
            />

            {/* Static background — desktop fallback */}
            <div
                className={`absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block ${videoFailed ? "opacity-100" : "opacity-0"
                    }`}
                style={{
                    backgroundImage: "url('/backgrounds/unclutter-bg.png')",
                }}
            />

            {/* Animated background — desktop */}
            {!videoFailed && (
                <video
                    data-unclutter-background-video
                    className="absolute inset-0 hidden h-full w-full object-cover md:block motion-reduce:hidden"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/backgrounds/unclutter-bg.png"
                    onError={() => setVideoFailed(true)}
                >
                    <source
                        src="/backgrounds/unclutter-bg.mp4"
                        type="video/mp4"
                    />
                </video>
            )}

            {/* Readability layer */}
            <div className="absolute inset-0 bg-[#FAF9F6]/20" />
        </div>
    );
}