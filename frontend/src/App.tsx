import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Layout from "@/components/layout";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentProgress from "@/pages/student/progress";
import StudentPlan from "@/pages/student/plan";
import StudentRecommendations from "@/pages/student/recommendations";

// Advisor Pages
import AdvisorDashboard from "@/pages/advisor/dashboard";
import AdvisorStudents from "@/pages/advisor/students";
import StudentDetail from "@/pages/advisor/student-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/student/*">
        <Layout>
          <Switch>
            <Route path="/student/dashboard" component={StudentDashboard} />
            <Route path="/student/progress" component={StudentProgress} />
            <Route path="/student/plan" component={StudentPlan} />
            <Route path="/student/recommendations" component={StudentRecommendations} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>

      <Route path="/advisor/*">
        <Layout>
          <Switch>
            <Route path="/advisor/dashboard" component={AdvisorDashboard} />
            <Route path="/advisor/students" component={AdvisorStudents} />
            <Route path="/advisor/students/:id" component={StudentDetail} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
