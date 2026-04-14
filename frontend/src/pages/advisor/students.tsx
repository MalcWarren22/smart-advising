import { useListStudents, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertTriangle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function AdvisorStudents() {
  const [search, setSearch] = useState("");

  const { data: students, isLoading } = useListStudents({
    query: { queryKey: getListStudentsQueryKey() }
  });

  if (isLoading || !students) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
          <CardContent><Skeleton className="h-96 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Students</h1>
        <p className="text-muted-foreground mt-1">
          Manage and review progress for all your assigned advisees.
        </p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold">Student Name</TableHead>
                <TableHead className="font-bold">Year</TableHead>
                <TableHead className="font-bold">GPA</TableHead>
                <TableHead className="font-bold">Progress</TableHead>
                <TableHead className="font-bold">Plan Status</TableHead>
                <TableHead className="text-right font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-gray-900">{student.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{student.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 uppercase tracking-wider text-[10px]">
                        Year {student.year}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${student.gpa < 2.5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {student.gpa.toFixed(2)}
                        </span>
                        {student.gpa < 2.5 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#006747] rounded-full" 
                            style={{ width: `${Math.round((student.creditsCompleted / student.creditsTotal) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {Math.round((student.creditsCompleted / student.creditsTotal) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.planApproved ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 w-fit gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 w-fit gap-1">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/advisor/students/${student.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#006747] hover:text-[#006747] hover:bg-[#006747]/10">
                          Review
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
