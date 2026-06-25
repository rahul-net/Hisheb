import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.budgetmaster",
  appName: "বাজেট মাস্টার",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
};

export default config;