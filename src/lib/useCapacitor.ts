"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export function useCapacitor() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Configure status bar
    const setupStatusBar = async () => {
      try {
        // Use light content (dark background, light text)
        await StatusBar.setStyle({ style: Style.Light });
        // Set background color to match app
        await StatusBar.setBackgroundColor({ color: "#F7F2EA" });
        // Don't overlay content
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (e) {
        console.log("StatusBar setup error:", e);
      }
    };

    setupStatusBar();

    // Handle Android back button
    const backHandler = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optionally minimize app instead of exit
        App.minimizeApp();
      }
    });

    return () => {
      backHandler.then((handler) => handler.remove());
    };
  }, []);
}
