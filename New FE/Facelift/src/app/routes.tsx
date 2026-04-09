import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { PropertyProfilePage } from './pages/PropertyProfilePage';
import { WriteReviewPage } from './pages/WriteReviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { NeighbourhoodPage } from './pages/NeighbourhoodPage';
import { NeighbourhoodsPage } from './pages/NeighbourhoodsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { Header } from './components/Header';

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <HomePage />
      </RootLayout>
    ),
  },
  {
    path: '/search',
    element: (
      <RootLayout>
        <SearchPage />
      </RootLayout>
    ),
  },
  {
    path: '/property/:id',
    element: (
      <RootLayout>
        <PropertyProfilePage />
      </RootLayout>
    ),
  },
  {
    path: '/write-review',
    element: (
      <RootLayout>
        <WriteReviewPage />
      </RootLayout>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <RootLayout>
        <DashboardPage />
      </RootLayout>
    ),
  },
  {
    path: '/comparison',
    element: (
      <RootLayout>
        <ComparisonPage />
      </RootLayout>
    ),
  },
  {
    path: '/neighbourhood/:id',
    element: (
      <RootLayout>
        <NeighbourhoodPage />
      </RootLayout>
    ),
  },
  {
    path: '/neighbourhoods',
    element: (
      <RootLayout>
        <NeighbourhoodsPage />
      </RootLayout>
    ),
  },
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
]);
