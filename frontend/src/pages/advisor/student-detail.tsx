import { useParams } from "wouter";
import { 
  useGetStudent, getGetStudentQueryKey,
  useGetProgress, getGetProgressQueryKey,
  useGetStudentPlan, getGetStudentPlanQueryKey,
  useApprovePlan, useAddAdvisorNote, useAdvisorUpdateStudentPlan,
  useListCurriculumCourses, getListCurriculumCoursesQueryKey,
  useListCurricula, getListCurriculaQueryKey,
  useUpdateStudentCurriculum,
  Course
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, MessageSquare, Target, Clock, Pencil, Save, X, Plus, Trash2, Info, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function StudentDetail() {
  const params = useParams();
  const studentId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [localSemesters, setLocalSemesters] = useState<any[]>([]);
  const [editNote, setEditNote] = useState("");
  const [courseToAdd, setCourseToAdd] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<number | null>(null);
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [pendingCurriculumId, setPendingCurriculumId] = useState<string>("");

  const { data: student, isLoading: isStudentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) }
  });

  const { data: progress, isLoading: isProgressLoading } = useGetProgress(studentId, {
    query: { enabled: !!studentId, queryKey: getGetProgressQueryKey(studentId) }
  });

  const { data: plan, isLoading: isPlanLoading } = useGetStudentPlan(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentPlanQueryKey(studentId) }
  });

  const { data: curricula } = useListCurricula({
    query: { queryKey: getListCurriculaQueryKey() }
  });

  const curriculumId = student?.curriculumId ?? 1;

  const { data: curriculumCourses } = useListCurriculumCourses(curriculumId, {
    query: { 
      enabled: !!student,
      queryKey: getListCurriculumCoursesQueryKey(curriculumId)
    }
  });

  useEffect(() => {
    if (plan && !isEditingPlan) {
      setLocalSemesters(plan.semesters as any[]);
    }
  }, [plan, isEditingPlan]);

  const approvePlan = useApprovePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentPlanQueryKey(studentId) });
        queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        toast({ title: "Success", description: "Student plan has been approved." });
      }
    }
  });

  const addNote = useAddAdvisorNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentPlanQueryKey(studentId) });
        setNoteText("");
        toast({ title: "Note Added", description: "Your note has been added to the student's record." });
      }
    }
  });

  const advisorUpdatePlan = useAdvisorUpdateStudentPlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentPlanQueryKey(studentId) });
        queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        setIsEditingPlan(false);
        setEditNote("");
        toast({ title: "Plan Updated", description: "The student's course plan has been modified." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to update the plan. Please try again." });
      }
    }
  });

  const updateCurriculum = useUpdateStudentCurriculum({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey(studentId) });
        queryClient.invalidateQueries({ queryKey: getGetStudentPlanQueryKey(studentId) });
        setCurriculumDialogOpen(false);
        setPendingCurriculumId("");
        toast({ title: "Curriculum Updated", description: "The student's curriculum has been changed." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to update curriculum." });
      }
    }
  });

  if (isStudentLoading || isProgressLoading || isPlanLoading || !student || !progress || !plan) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  const coursesById = (curriculumCourses ?? []).reduce((acc, course) => {
    acc[course.id] = course;
    return acc;
  }, {} as Record<number, Course>);

  const handleApprove = () => {
    approvePlan.mutate({ studentId });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate({ studentId, data: { note: noteText } });
  };

  const handleStartEdit = () => {
    setLocalSemesters(plan.semesters as any[]);
    setEditNote("");
    setIsEditingPlan(true);
  };

  const handleCancelEdit = () => {
    setLocalSemesters(plan.semesters as any[]);
    setIsEditingPlan(false);
    setEditNote("");
  };

  const handleSaveEdit = () => {
    advisorUpdatePlan.mutate({
      studentId,
      data: {
        semesters: localSemesters,
        note: editNote.trim() || undefined,
      }
    });
  };

  const handleRemoveCourse = (semesterIdx: number, courseId: number) => {
    const newSemesters = [...localSemesters];
    const semester = { ...newSemesters[semesterIdx] };
    semester.courses = semester.courses.filter((id: number) => id !== courseId);
    semester.totalCredits = semester.courses.reduce((sum: number, id: number) => {
      return sum + (coursesById[id]?.credits || 0);
    }, 0);
    newSemesters[semesterIdx] = semester;
    setLocalSemesters(newSemesters);
  };

  const handleAddCourse = (semesterIdx: number) => {
    if (!courseToAdd) return;
    const courseId = parseInt(courseToAdd, 10);
    const newSemesters = [...localSemesters];
    const semester = { ...newSemesters[semesterIdx] };
    if (!semester.courses.includes(courseId)) {
      semester.courses = [...semester.courses, courseId];
      semester.totalCredits = semester.courses.reduce((sum: number, id: number) => {
        return sum + (coursesById[id]?.credits || 0);
      }, 0);
      newSemesters[semesterIdx] = semester;
      setLocalSemesters(newSemesters);
    }
    setCourseToAdd("");
    setDialogOpen(null);
  };

  const handleChangeCurriculum = () => {
    if (!pendingCurriculumId) return;
    updateCurriculum.mutate({ studentId, data: { curriculumId: parseInt(pendingCurriculumId, 10) } });
  };

  const getAvailableCourses = () => {
    const plannedIds = new Set<number>();
    localSemesters.forEach(s => s.courses.forEach((c: number) => plannedIds.add(c)));
    return (curriculumCourses ?? []).filter(c => !plannedIds.has(c.id));
  };

  const displaySemesters = isEditingPlan ? localSemesters : (plan.semesters as any[]);

  const curriculumColor = student.curriculumName?.toLowerCase().includes("cyber")
    ? "bg-indigo-100 text-indigo-800"
    : "bg-emerald-100 text-emerald-800";

  return (
    <div className="space-y-8 pb-10">
      {/* Student header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#006747] text-white flex items-center justify-center text-2xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{student.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="font-mono">{student.username}</span>
              <span>•</span>
              <span className="uppercase font-bold tracking-wider">Year {student.year}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${curriculumColor} hover:${curriculumColor} border-none text-xs`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {student.curriculumName ?? "CS General"}
              </Badge>
              <Dialog open={curriculumDialogOpen} onOpenChange={setCurriculumDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-gray-800 transition-colors">
                    Change
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Curriculum</DialogTitle>
                    <DialogDescription>
                      Reassign <strong>{student.name}</strong> to a different program. This will update their degree audit and credit total.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <Select
                      value={pendingCurriculumId}
                      onValueChange={setPendingCurriculumId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(curricula ?? []).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} ({c.totalCredits} cr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full bg-[#006747] hover:bg-[#005238] text-white"
                      onClick={handleChangeCurriculum}
                      disabled={!pendingCurriculumId || updateCurriculum.isPending}
                    >
                      {updateCurriculum.isPending ? "Saving..." : "Confirm Change"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-md border border-gray-100">
            <div className="text-center px-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">GPA</div>
              <div className={`text-xl font-bold ${student.gpa < 2.5 ? 'text-red-600' : 'text-gray-900'}`}>
                {student.gpa.toFixed(2)}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-center px-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Progress</div>
              <div className="text-xl font-bold text-gray-900">{progress.percentComplete}%</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="plan">Course Plan</TabsTrigger>
          <TabsTrigger value="progress">Degree Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plan" className="mt-6 space-y-6">
          {/* Approval status card */}
          <Card className="shadow-sm border-gray-200 border-t-4 border-t-[#006747]">
            <CardHeader className="bg-gray-50/50 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-lg">Plan Approval Status</CardTitle>
                  <CardDescription>Review, modify, and approve the student's proposed course plan</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {plan.approved ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-3 py-1">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approved on {new Date(plan.approvedAt!).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleApprove}
                      disabled={approvePlan.isPending || isEditingPlan}
                      className="bg-[#006747] hover:bg-[#005238]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {approvePlan.isPending ? "Approving..." : "Approve Plan"}
                    </Button>
                  )}
                  {!isEditingPlan ? (
                    <Button
                      variant="outline"
                      onClick={handleStartEdit}
                      className="border-gray-300"
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Edit Plan
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={advisorUpdatePlan.isPending}
                      >
                        <X className="w-4 h-4 mr-1.5" /> Cancel
                      </Button>
                      <Button
                        onClick={handleSaveEdit}
                        disabled={advisorUpdatePlan.isPending}
                        className="bg-[#006747] hover:bg-[#005238]"
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        {advisorUpdatePlan.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            {isEditingPlan && (
              <div className="px-6 pb-0 pt-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    You are editing this student's plan. Changes will reset the approval status and notify the student via notes.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {displaySemesters.map((semester: any, idx: number) => (
                  <Card key={idx} className="border border-gray-200 shadow-none">
                    <CardHeader className="bg-gray-100/50 px-4 py-2 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
                      <span className="font-bold text-gray-800 capitalize">{semester.semester} {semester.year}</span>
                      <Badge variant="outline" className="bg-white">{semester.totalCredits} cr</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-100">
                        {semester.courses.map((courseId: number) => {
                          const course = coursesById[courseId];
                          if (!course) return null;
                          return (
                            <div key={courseId} className="px-4 py-3 flex items-center justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <Badge variant="secondary" className="font-mono text-[10px] mt-0.5 shrink-0">{course.code}</Badge>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-gray-900 truncate">{course.name}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                    {course.credits} cr • {course.category.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>
                              {isEditingPlan && (
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
                          );
                        })}
                        {semester.courses.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground italic">No courses planned</div>
                        )}
                      </div>
                    </CardContent>
                    {isEditingPlan && (
                      <CardFooter className="p-3 bg-gray-50 border-t border-gray-100">
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
                                Select a course from the student's curriculum to add to {semester.semester} {semester.year}.
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

              {isEditingPlan && (
                <div className="mt-6 space-y-2 pt-6 border-t border-gray-100">
                  <label className="text-sm font-bold text-gray-700">Leave a note for the student (optional)</label>
                  <Textarea
                    placeholder="Explain what changes you made and why..."
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advisor Notes */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Advisor Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                {plan.advisorNotes && plan.advisorNotes.map((note: any) => (
                  <div key={note.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900 text-sm">{note.advisorName}</span>
                      <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{note.note}</p>
                  </div>
                ))}
                {(!plan.advisorNotes || plan.advisorNotes.length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-gray-200 rounded-md">
                    No notes added yet.
                  </div>
                )}
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="text-sm font-bold text-gray-700">Add a Note</label>
                <Textarea 
                  placeholder="Enter notes about plan changes, discussions, or recommendations..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!noteText.trim() || addNote.isPending}
                  className="w-full sm:w-auto"
                >
                  {addNote.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#006747]" />
                Curriculum Audit — {student.curriculumName ?? "CS General"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {progress.courses.map((course: any) => (
                  <div key={course.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono text-[10px]">{course.code}</Badge>
                        <span className="font-bold text-gray-900 text-sm">{course.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {course.credits} cr • Year {course.year} • {course.category.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      {course.status === 'completed' && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>}
                      {course.status === 'in_progress' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>}
                      {course.status === 'not_started' && <Badge variant="outline" className="text-gray-500">Not Started</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
