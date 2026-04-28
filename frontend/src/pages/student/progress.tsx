import { useGetProgress, getGetProgressQueryKey, useUpdateCourseStatus, useGetMe, getGetMeQueryKey, useGetStudent, getGetStudentQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, CircleDashed, Filter, Search, Lock, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CourseWithStatus, CourseWithStatusStatus } from "@workspace/api-client-react";

export default function StudentProgress() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const queryClient = useQueryClient();
  const studentId = user?.studentId || 0;

  const { data: progress, isLoading } = useGetProgress(studentId, {
    query: { 
      enabled: !!studentId,
      queryKey: getGetProgressQueryKey(studentId)
    }
  });

  const { data: studentInfo } = useGetStudent(studentId, {
    query: {
      enabled: !!studentId,
      queryKey: getGetStudentQueryKey(studentId),
    }
  });

  const updateStatus = useUpdateCourseStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey(studentId) });
      }
    }
  });

  if (isLoading || !progress) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-32 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleStatusChange = (courseId: number, status: CourseWithStatusStatus) => {
    updateStatus.mutate({
      studentId,
      courseId,
      data: { status }
    });
  };

  // Group courses by year
  const coursesByYear = progress.courses.reduce((acc, course) => {
    const year = course.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(course);
    return acc;
  }, {} as Record<number, CourseWithStatus[]>);

  const yearLabels: Record<number, string> = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "in_progress": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <CircleDashed className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200";
      case "in_progress": return "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Degree Progress</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-muted-foreground">
            Track your curriculum requirements and update course statuses.
          </p>
          {studentInfo?.curriculumName && (
            <Badge variant="outline" className="bg-[#006747]/10 text-[#006747] border-[#006747]/30 gap-1.5 shrink-0">
              <GraduationCap className="w-3 h-3" />
              {studentInfo.curriculumName}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search courses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-50/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {[1, 2, 3, 4].map(year => {
          const yearCourses = coursesByYear[year] || [];
          
          // Filter courses
          const filteredCourses = yearCourses.filter(course => {
            const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase()) || 
                                  course.code.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === "all" || course.status === filter;
            return matchesSearch && matchesFilter;
          });

          if (filteredCourses.length === 0) return null;

          const yearCompleted = yearCourses.filter(c => c.status === "completed").reduce((sum, c) => sum + c.credits, 0);
          const yearTotal = yearCourses.reduce((sum, c) => sum + c.credits, 0);

          return (
            <Card key={year} className="shadow-sm border-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-[#006747]">{yearLabels[year]}</CardTitle>
                  <CardDescription className="mt-1">{yearCourses.length} Courses Required</CardDescription>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900">{yearCompleted} / {yearTotal} Credits</span>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#006747] rounded-full" 
                      style={{ width: `${(yearCompleted / yearTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {filteredCourses.map(course => (
                    <div key={course.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <Badge variant="secondary" className="font-mono bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200/50">
                            {course.code}
                          </Badge>
                          <span className="text-sm font-bold text-gray-900">{course.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {course.credits} Credits
                          </span>
                          <span className="capitalize">{course.category.replace('_', ' ')}</span>
                          {course.prerequisites.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Lock className="w-3 h-3" />
                              Prereqs: {course.prerequisites.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:w-48 shrink-0">
                        <Select 
                          value={course.status} 
                          onValueChange={(val: CourseWithStatusStatus) => handleStatusChange(course.id, val)}
                          disabled={!course.prerequisitesMet && course.status === "not_started"}
                        >
                          <SelectTrigger className={`w-full ${getStatusBadgeClassName(course.status)}`}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(course.status)}
                              <span className="capitalize">{course.status.replace('_', ' ')}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="not_started">Not Started</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
