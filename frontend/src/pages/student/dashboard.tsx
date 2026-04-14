import { useGetStudentDashboard, getGetStudentDashboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, BookOpen, AlertCircle, CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const { data: dashboard, isLoading } = useGetStudentDashboard(user?.studentId || 0, {
    query: { 
      enabled: !!user?.studentId,
      queryKey: getGetStudentDashboardQueryKey(user?.studentId || 0)
    }
  });

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { 
    student, 
    percentComplete, 
    completedCredits, 
    remainingCredits, 
    currentSemesterCourses, 
    upcomingDeadlines,
    gpaHistory 
  } = dashboard;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {student.name}. Here's your academic overview.
          </p>
        </div>
        <Badge variant={student.planApproved ? "default" : "secondary"} className={`text-sm px-3 py-1 font-medium ${student.planApproved ? 'bg-[#006747] hover:bg-[#006747]/90' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}>
          {student.planApproved ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Plan Approved</span>
          ) : (
            <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Plan Pending Approval</span>
          )}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Degree Progress Card */}
        <Card className="md:col-span-2 shadow-sm border-gray-200 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-[#006747]" />
              Degree Progress
            </CardTitle>
            <CardDescription>B.S. Computer Science - General</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-40 h-40 flex shrink-0 items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-gray-100 stroke-current" 
                    strokeWidth="10" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent"
                  ></circle>
                  <circle 
                    className="text-[#006747] stroke-current" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    strokeDasharray={`${percentComplete * 2.51} 251.2`}
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold tracking-tighter text-gray-900">{percentComplete}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Complete</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-5 w-full">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Credits Completed</span>
                    <span className="font-bold text-gray-900">{completedCredits} / {student.creditsTotal}</span>
                  </div>
                  <Progress value={(completedCredits / student.creditsTotal) * 100} className="h-2.5" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Cumulative GPA</div>
                    <div className="text-2xl font-bold text-gray-900">{student.gpa.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Remaining Credits</div>
                    <div className="text-2xl font-bold text-gray-900">{remainingCredits}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines Card */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#f6c042]" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingDeadlines.map((deadline, i) => (
                  <div key={i} className="p-4 flex gap-4 items-start hover:bg-gray-50/50 transition-colors">
                    <div className="bg-gray-100 rounded-md p-2 text-center min-w-14 shrink-0">
                      <div className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(deadline.date), "MMM")}</div>
                      <div className="text-lg font-bold text-gray-900 leading-none">{format(new Date(deadline.date), "d")}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-900 leading-tight">{deadline.title}</span>
                      <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                        {deadline.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No upcoming deadlines.</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Courses */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Current Semester
            </CardTitle>
            <CardDescription>Courses you are currently taking</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {currentSemesterCourses.length > 0 ? (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {currentSemesterCourses.map((course) => (
                  <div key={course.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono text-xs">
                          {course.code}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground">{course.credits} Credits</span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">{course.name}</h4>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 w-fit">
                      <Clock className="w-3 h-3" /> In Progress
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <BookOpen className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No courses currently in progress.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPA Trend Placeholder */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              GPA Trend
            </CardTitle>
            <CardDescription>Your academic performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-end justify-between gap-2 pt-6">
              {gpaHistory.map((point, i) => {
                // Calculate height percentage based on GPA (min 2.0, max 4.0)
                const heightPercentage = Math.max(10, ((point.gpa - 2.0) / 2.0) * 100);
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="text-xs font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {point.gpa.toFixed(2)}
                    </div>
                    <div className="w-full relative h-full flex items-end justify-center">
                      <div 
                        className="w-full max-w-12 bg-[#006747]/80 hover:bg-[#006747] rounded-t-sm transition-all duration-300"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase truncate w-full text-center mt-2">
                      {point.semester}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
