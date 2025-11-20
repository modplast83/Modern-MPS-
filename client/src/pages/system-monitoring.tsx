import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Gauge, 
  MemoryStick, 
  Server,
  Code2,
  FileWarning,
  RefreshCw,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SystemMonitoring() {
  const { data: performanceReport, isLoading: perfLoading, refetch: refetchPerf } = useQuery({
    queryKey: ['/api/monitoring/performance-report'],
    refetchInterval: 30000, // كل 30 ثانية
  });

  const { data: memoryData, isLoading: memLoading, refetch: refetchMem } = useQuery({
    queryKey: ['/api/monitoring/memory'],
    refetchInterval: 30000,
  });

  const { data: slowQueries, isLoading: queriesLoading, refetch: refetchQueries } = useQuery({
    queryKey: ['/api/monitoring/slow-queries'],
    refetchInterval: 60000, // كل دقيقة
  });

  const { data: codeHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/monitoring/code-health'],
    refetchInterval: 300000, // كل 5 دقائق
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'text-green-500';
      case 'degraded':
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <Badge className={colors[severity as keyof typeof colors] || colors.medium}>{severity}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="system-monitoring-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">مراقبة النظام</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            مراقبة الأداء والصحة العامة للنظام
          </p>
        </div>
        <Button
          onClick={() => {
            refetchPerf();
            refetchMem();
            refetchQueries();
            refetchHealth();
          }}
          variant="outline"
          data-testid="button-refresh-all"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث الكل
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-system-health">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 space-x-reverse">
              {getStatusIcon((performanceReport as any)?.systemHealth?.status || 'unknown')}
              <span className="text-2xl font-bold" data-testid="text-system-status">
                {(performanceReport as any)?.systemHealth?.status || 'جاري التحميل...'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2" data-testid="text-uptime">
              وقت التشغيل: {(performanceReport as any)?.systemHealth?.uptimeFormatted || '-'}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-api-performance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أداء API</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-response-time">
              {(performanceReport as any)?.api?.averageResponseTime || 0} ms
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              الطلبات البطيئة: {(performanceReport as any)?.api?.slowRequestsPercent || 0}%
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-database">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قاعدة البيانات</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-query-time">
              {(performanceReport as any)?.database?.averageTime || 0} ms
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              استعلامات بطيئة: {(performanceReport as any)?.database?.slowQueries || 0}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-memory">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الذاكرة</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-memory-used">
              {(memoryData as any)?.current?.current?.heapUsedMB || 0} MB
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              الاتجاه: {(memoryData as any)?.current?.trend?.direction || '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList data-testid="tabs-monitoring">
          <TabsTrigger value="performance" data-testid="tab-performance">
            <Gauge className="h-4 w-4 mr-2" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="database" data-testid="tab-database">
            <Database className="h-4 w-4 mr-2" />
            قاعدة البيانات
          </TabsTrigger>
          <TabsTrigger value="memory" data-testid="tab-memory">
            <MemoryStick className="h-4 w-4 mr-2" />
            الذاكرة
          </TabsTrigger>
          <TabsTrigger value="code-health" data-testid="tab-code-health">
            <Code2 className="h-4 w-4 mr-2" />
            صحة الكود
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card data-testid="card-api-endpoints">
            <CardHeader>
              <CardTitle>أداء API Endpoints</CardTitle>
              <CardDescription>متوسط وقت الاستجابة لكل endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : (
                <div className="space-y-2">
                  {(performanceReport as any)?.api?.endpoints?.map((endpoint: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`endpoint-${index}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium" data-testid={`endpoint-name-${index}`}>{endpoint.endpoint}</div>
                        <div className="text-sm text-muted-foreground">
                          {endpoint.count} طلب
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-mono" data-testid={`endpoint-avg-${index}`}>
                          {endpoint.avgTime} ms
                        </div>
                        <div className="text-xs text-muted-foreground">
                          max: {endpoint.maxTime} ms
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!(performanceReport as any)?.api?.endpoints || (performanceReport as any).api.endpoints.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات بعد
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card data-testid="card-slow-queries">
            <CardHeader>
              <CardTitle>الاستعلامات البطيئة</CardTitle>
              <CardDescription>استعلامات قاعدة البيانات التي استغرقت وقتاً طويلاً</CardDescription>
            </CardHeader>
            <CardContent>
              {queriesLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : (
                <div className="space-y-2">
                  {(slowQueries as any)?.slowQueries?.slice(0, 10).map((query: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border"
                      data-testid={`slow-query-${index}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive" data-testid={`query-duration-${index}`}>
                          {query.duration} ms
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {query.timestamp && formatDistanceToNow(new Date(query.timestamp), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto" data-testid={`query-text-${index}`}>
                        {query.query}
                      </pre>
                    </div>
                  ))}
                  {(!(slowQueries as any)?.slowQueries || (slowQueries as any).slowQueries.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      ✅ لا توجد استعلامات بطيئة
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(slowQueries as any)?.patterns && (slowQueries as any).patterns.length > 0 && (
            <Card data-testid="card-query-patterns">
              <CardHeader>
                <CardTitle>أنماط الاستعلامات</CardTitle>
                <CardDescription>الاستعلامات الأكثر تكراراً</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(slowQueries as any).patterns.slice(0, 5).map((pattern: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 text-sm truncate">{pattern.query.substring(0, 100)}...</div>
                      <div className="text-sm text-muted-foreground mr-4">
                        {pattern.count}x | avg: {pattern.avgTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card data-testid="card-memory-stats">
            <CardHeader>
              <CardTitle>استهلاك الذاكرة</CardTitle>
              <CardDescription>مراقبة استخدام الذاكرة وكشف التسريبات</CardDescription>
            </CardHeader>
            <CardContent>
              {memLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : (
                <>
                  {(memoryData as any)?.current?.warnings && (memoryData as any).current.warnings.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {(memoryData as any).current.warnings.map((warning: string, i: number) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">الحالة الحالية</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Heap Used:</span>
                          <span className="font-mono">{(memoryData as any)?.current?.current?.heapUsedMB || 0} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Heap Total:</span>
                          <span className="font-mono">{(memoryData as any)?.current?.current?.heapTotalMB || 0} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RSS:</span>
                          <span className="font-mono">{(memoryData as any)?.current?.current?.rssMB || 0} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>External:</span>
                          <span className="font-mono">{(memoryData as any)?.current?.current?.externalMB || 0} MB</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">الاتجاه</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span>الاتجاه:</span>
                          <Badge variant={
                            (memoryData as any)?.current?.trend?.direction === 'increasing' ? 'destructive' :
                            (memoryData as any)?.current?.trend?.direction === 'decreasing' ? 'default' :
                            'secondary'
                          }>
                            {(memoryData as any)?.current?.trend?.direction || 'stable'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>التغيير:</span>
                          <span className="font-mono">{(memoryData as any)?.current?.trend?.changeMB || 0} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تسريب محتمل:</span>
                          <span>{(memoryData as any)?.current?.trend?.isMemoryLeak ? '⚠️ نعم' : '✅ لا'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Health Tab */}
        <TabsContent value="code-health" className="space-y-4">
          <Card data-testid="card-code-health-summary">
            <CardHeader>
              <CardTitle>صحة الكود</CardTitle>
              <CardDescription>
                آخر فحص: {(codeHealth as any)?.timestamp && formatDistanceToNow(new Date((codeHealth as any).timestamp), {
                  addSuffix: true,
                  locale: ar
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="text-center p-4 border rounded">
                      <div className="text-3xl font-bold">{(codeHealth as any)?.totalFiles || 0}</div>
                      <div className="text-sm text-muted-foreground">إجمالي الملفات</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-3xl font-bold text-yellow-500">{(codeHealth as any)?.issues?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">المشاكل</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-3xl font-bold text-blue-500">
                        {(codeHealth as any)?.recommendations?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">التوصيات</div>
                    </div>
                  </div>

                  {(codeHealth as any)?.recommendations && (codeHealth as any).recommendations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">التوصيات</h4>
                      <div className="space-y-2">
                        {(codeHealth as any).recommendations.map((rec: string, i: number) => (
                          <Alert key={i}>
                            <TrendingUp className="h-4 w-4" />
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {(codeHealth as any)?.issues && (codeHealth as any).issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">المشاكل المكتشفة</h4>
                      <div className="space-y-2">
                        {(codeHealth as any).issues.map((issue: any, i: number) => (
                          <div key={i} className="p-3 border rounded space-y-1" data-testid={`code-issue-${i}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileWarning className="h-4 w-4 text-yellow-500" />
                                {getSeverityBadge(issue.severity)}
                                <span className="text-sm font-medium">{issue.type}</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{issue.file}</div>
                            <div className="text-sm">{issue.message}</div>
                            {issue.suggestion && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                💡 {issue.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!(codeHealth as any)?.issues || (codeHealth as any).issues.length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <div className="text-lg font-semibold">صحة الكود ممتازة!</div>
                      <div className="text-sm text-muted-foreground">لم يتم العثور على مشاكل</div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
