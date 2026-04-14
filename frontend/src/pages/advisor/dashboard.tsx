import { useGetAdvisorDashboard, getGetAdvisorDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, CheckCircle, FileText, ArrowRight, Activity, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdvisorDashboard() {
  const { data: dashboard, isLoading } = useGetAdvisorDashboard({
    query: { queryKey: getGetAdvisorDashboardQueryKey() }
  });

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Advisor Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your advisees and pending actions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Students</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">On Track</p>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.studentsOnTrack}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">At Risk</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.studentsAtRisk}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-[#006747] bg-[#006747]/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-bold text-[#006747] uppercase tracking-wider">Pending Approvals</p>
              <FileText className="h-4 w-4 text-[#006747]" />
            </div>
            <div className="text-3xl font-bold text-[#006747]">{dashboard.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-[#006747]" />
                Student Priority List
              </CardTitle>
              <CardDescription>Students needing attention</CardDescription>
            </div>
            <Link href="/advisor/students">
              <Button variant="ghost" size="sm" className="text-[#006747]">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {dashboard.studentProgress.slice(0, 5).map(student => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${student.atRisk ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    <div>
                      <h4 className="font-bold text-gray-900">{student.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="uppercase font-semibold tracking-wider">Year {student.year}</span>
                        <span>•</span>
                        <span>GPA: <span className="font-bold text-gray-700">{student.gpa.toFixed(2)}</span></span>
                        <span>•</span>
                        <span>{student.percentComplete}% Complete</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!student.planApproved && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                        Plan Pending
                      </Badge>
                    )}
                    <Link href={`/advisor/students/${student.id}`}>
                      <Button variant="outline" size="sm" className="h-8">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {dashboard.recentActivity.map((activity, i) => (
                <div key={i} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <p className="text-sm text-gray-800 leading-snug">
                    <span className="font-bold text-gray-900">{activity.studentName}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
