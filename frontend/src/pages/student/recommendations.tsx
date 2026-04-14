import { useGetRecommendations, getGetRecommendationsQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ArrowRight, Zap, Target, BookOpen } from "lucide-react";

export default function StudentRecommendations() {
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const studentId = user?.studentId || 0;

  const { data: recommendations, isLoading } = useGetRecommendations(studentId, {
    query: { 
      enabled: !!studentId,
      queryKey: getGetRecommendationsQueryKey(studentId)
    }
  });

  if (isLoading || !recommendations) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <Zap className="w-4 h-4 text-red-500" />;
      case "medium": return <Target className="w-4 h-4 text-amber-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      default: return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recommendations</h1>
        <p className="text-muted-foreground mt-1">
          Smart suggestions for your next semester based on your progress and prerequisites.
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <Card key={index} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#006747] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="font-mono bg-gray-100 text-gray-800">
                        {rec.course.code}
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-900">{rec.course.name}</h3>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700 border border-gray-100 relative">
                      <div className="absolute -left-2 -top-2 bg-white rounded-full p-1 border border-gray-100 shadow-sm text-[#006747]">
                        <Lightbulb className="w-4 h-4 fill-current opacity-20" />
                      </div>
                      <p className="pl-2 leading-relaxed">{rec.reason}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:w-64 shrink-0 bg-gray-50/50 flex flex-col justify-center gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">Priority</div>
                      <Badge variant="outline" className={`w-fit flex items-center gap-1.5 capitalize font-medium ${getPriorityColor(rec.priority)}`}>
                        {getPriorityIcon(rec.priority)}
                        {rec.priority}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">Course Info</div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        {rec.course.credits} Credits • {rec.course.category.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-gray-200">
            <CardContent className="p-12 text-center flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No recommendations right now</h3>
              <p className="text-muted-foreground max-w-md">
                You're perfectly on track with your current plan and have no immediate gaps to address.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
