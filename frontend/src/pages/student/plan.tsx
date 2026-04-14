import { useGetStudentPlan, getGetStudentPlanQueryKey, useListCourses, getListCoursesQueryKey, useUpdateStudentPlan, useGetMe, getGetMeQueryKey, Course } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Save, Calendar, AlertCircle, Trash2, Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const studentId = user?.studentId || 0;

  const { data: plan, isLoading: isLoadingPlan } = useGetStudentPlan(studentId, {
    query: { 
      enabled: !!studentId,
      queryKey: getGetStudentPlanQueryKey(studentId)
    }
  });

  const { data: allCourses, isLoading: isLoadingCourses } = useListCourses({
    query: {
      queryKey: getListCoursesQueryKey()
    }
  });

  const updatePlan = useUpdateStudentPlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentPlanQueryKey(studentId) });
        toast({
          title: "Plan updated",
          description: "Your course plan has been saved successfully."
        });
        setHasChanges(false);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update your course plan. Please try again."
        });
      }
    }
  });

  const [localSemesters, setLocalSemesters] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [courseToAdd, setCourseToAdd] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<number | null>(null);

  useEffect(() => {
    if (plan && !hasChanges) {
      setLocalSemesters(plan.semesters);
    }
  }, [plan, hasChanges]);

  if (isLoadingPlan || isLoadingCourses || !plan || !allCourses) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const coursesById = allCourses.reduce((acc, course) => {
    acc[course.id] = course;
    return acc;
  }, {} as Record<number, Course>);

  const handleSave = () => {
    updatePlan.mutate({
      studentId,
      data: {
        semesters: localSemesters
      }
    });
  };

  const handleRemoveCourse = (semesterIdx: number, courseId: number) => {
    if (plan.approved) return;
    
    const newSemesters = [...localSemesters];
    const semester = newSemesters[semesterIdx];
    semester.courses = semester.courses.filter((id: number) => id !== courseId);
    
    // Recalculate credits
    semester.totalCredits = semester.courses.reduce((sum: number, id: number) => {
      return sum + (coursesById[id]?.credits || 0);
    }, 0);
    
    setLocalSemesters(newSemesters);
    setHasChanges(true);
  };

  const handleAddCourse = (semesterIdx: number) => {
    if (plan.approved || !courseToAdd) return;
    
    const courseId = parseInt(courseToAdd, 10);
    const newSemesters = [...localSemesters];
    const semester = newSemesters[semesterIdx];
    
    if (!semester.courses.includes(courseId)) {
      semester.courses.push(courseId);
      // Recalculate credits
      semester.totalCredits = semester.courses.reduce((sum: number, id: number) => {
        return sum + (coursesById[id]?.credits || 0);
      }, 0);
      
      setLocalSemesters(newSemesters);
      setHasChanges(true);
    }
    
    setCourseToAdd("");
    setDialogOpen(null);
  };

  // Get courses not currently in the plan for the add dropdown
  const getAvailableCourses = () => {
    const plannedCourseIds = new Set();
    localSemesters.forEach(s => s.courses.forEach((c: number) => plannedCourseIds.add(c)));
    return allCourses.filter(c => !plannedCourseIds.has(c.id));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Course Plan</h1>
          <p className="text-muted-foreground mt-1">
            Map out your future semesters. 
          </p>
        </div>
        <div className="flex items-center gap-3">
          {plan.approved ? (
            <Badge variant="default" className="bg-[#006747] text-white">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approved
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <AlertCircle className="w-4 h-4 mr-1.5" /> Pending Approval
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updatePlan.isPending || plan.approved}
            className={hasChanges ? "bg-[#006747] text-white hover:bg-[#005238]" : ""}
          >
            <Save className="w-4 h-4 mr-2" />
            {updatePlan.isPending ? "Saving..." : "Save Plan"}
          </Button>
        </div>
      </div>

      {plan.approved && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <Info className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-bold">Plan is locked</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Your course plan has been approved by your advisor. To make changes, please contact your advisor to unlock the plan.
          </AlertDescription>
        </Alert>
      )}

      {plan.advisorNotes && plan.advisorNotes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Advisor Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.advisorNotes.map((note) => (
              <div key={note.id} className="text-sm bg-white p-4 rounded-md border border-amber-100">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-bold text-gray-700">{note.advisorName}</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-800">{note.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {localSemesters.map((semester, idx) => (
          <Card key={`${semester.semester}-${semester.year}`} className={`shadow-sm border-gray-200 flex flex-col ${plan.approved ? 'opacity-80' : ''}`}>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006747]" />
                <CardTitle className="text-lg text-gray-900 capitalize">
                  {semester.semester} {semester.year}
                </CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-bold text-gray-600 bg-white">
                {semester.totalCredits} Credits
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {semester.courses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {semester.courses.map((courseId: number) => {
                    const course = coursesById[courseId];
                    if (!course) return null;
                    return (
                      <div key={courseId} className="p-4 flex flex-col gap-2 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono bg-gray-100 text-gray-800 text-[10px]">
                              {course.code}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">{course.name}</span>
                          </div>
                          {!plan.approved && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-gray-400 hover:text-red-500 shrink-0"
                              onClick={() => handleRemoveCourse(idx, courseId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          <span>{course.credits} cr</span>
                          <span>•</span>
                          <span>{course.category.replace('_', ' ')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm border-t border-gray-100 border-dashed">
                  No courses planned for this semester.
                </div>
              )}
            </CardContent>
            {!plan.approved && (
              <CardFooter className="p-3 bg-gray-50 border-t border-gray-100 mt-auto">
                <Dialog open={dialogOpen === idx} onOpenChange={(open) => setDialogOpen(open ? idx : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed border-gray-300 text-gray-500 hover:text-gray-900 bg-white">
                      <Plus className="w-3 h-3 mr-1.5" /> Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Course</DialogTitle>
                      <DialogDescription>
                        Select a course to add to {semester.semester} {semester.year}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <Select value={courseToAdd} onValueChange={setCourseToAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {getAvailableCourses().map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.code} - {c.name} ({c.credits} cr)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        className="w-full bg-[#006747] hover:bg-[#005238] text-white" 
                        onClick={() => handleAddCourse(idx)}
                        disabled={!courseToAdd}
                      >
                        Add to Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
