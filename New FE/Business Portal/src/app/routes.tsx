import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Login } from "./components/login";
import { Dashboard } from "./components/dashboard";
import { ReviewFeed } from "./components/review-feed";
import { ModerationQueue } from "./components/moderation-queue";
import { CategoryPerformance } from "./components/category-performance";
import { BenchmarkComparison } from "./components/benchmark-comparison";
import { RenterSignals } from "./components/renter-signals";
import { ReviewGapAlerts } from "./components/review-gap-alerts";
import { TeamAccess } from "./components/team-access";
import { CompanyProfile } from "./components/company-profile";
import { NotificationSettings } from "./components/notification-settings";
import { PropertyPublicView } from "./components/property-public-view";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/portal",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "reviews", element: <ReviewFeed /> },
      { path: "moderation", element: <ModerationQueue /> },
      { path: "performance", element: <CategoryPerformance /> },
      { path: "benchmark", element: <BenchmarkComparison /> },
      { path: "signals", element: <RenterSignals /> },
      { path: "alerts", element: <ReviewGapAlerts /> },
      { path: "team", element: <TeamAccess /> },
      { path: "profile", element: <CompanyProfile /> },
      { path: "settings", element: <NotificationSettings /> },
    ],
  },
  {
    path: "/property/:id",
    element: <PropertyPublicView />,
  },
]);
