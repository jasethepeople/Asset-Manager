import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  AgentDetailPage, AgentsPage, GenotypesPage, ActivityPage, NotFoundPage, ObjectivesPage,
  OverviewPage, Shell,
} from '@/components/console-ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: 1, refetchOnWindowFocus: false } },
});

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <Shell><RoutedErrorBoundary><Switch>
    <Route path="/" component={OverviewPage} />
    <Route path="/objectives" component={ObjectivesPage} />
    <Route path="/agents/:id" component={AgentDetailPage} />
    <Route path="/agents" component={AgentsPage} />
    <Route path="/genotypes" component={GenotypesPage} />
    <Route path="/activity" component={ActivityPage} />
    <Route component={NotFoundPage} />
  </Switch></RoutedErrorBoundary></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;