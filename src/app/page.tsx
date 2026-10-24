'use client';

import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/layout/HeroSection";
import LandingWalkthrough from "@/components/landing/LandingWalkthrough";
import LandingCapabilities from "@/components/landing/LandingCapabilities";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPreview from "@/components/landing/LandingPreview";
import LandingWorkflow from "@/components/landing/LandingWorkflow";
import LandingValue from "@/components/landing/LandingValue";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* 1. Navbar */}
      <Navbar />

      {/* 2 & 3. Hero Section & Hero Visual Mockup */}
      <HeroSection />

      {/* Video Animasi Walkthrough Interaktif */}
      <LandingWalkthrough />

      {/* 4. Social Proof & Core Capabilities */}
      <LandingCapabilities />

      {/* 5. Features Section */}
      <LandingFeatures />

      {/* 6. Product Preview Section */}
      <LandingPreview />

      {/* 7. Workflow Section */}
      <LandingWorkflow />

      {/* 8. Project Management Value Section */}
      <LandingValue />

      {/* 9. CTA Section */}
      <LandingCTA />

      {/* 10. Footer */}
      <LandingFooter />
    </main>
  );
}

