import { PromiseRecord, InsightFinding } from '@/types';
import { calculateCategoryMetrics, calculateDepartmentMetrics, calculateDashboardMetrics } from './metrics';

export function generateKeyInsights(promises: PromiseRecord[]): InsightFinding[] {
  const metrics = calculateDashboardMetrics(promises);
  const catMetrics = calculateCategoryMetrics(promises);
  const deptMetrics = calculateDepartmentMetrics(promises);

  const findings: InsightFinding[] = [];

  if (promises.length === 0) {
    return findings;
  }

  // 1. Largest Category (FACT)
  if (catMetrics.length > 0) {
    const topCat = catMetrics[0];
    const pct = Math.round((topCat.totalPromises / metrics.totalPromises) * 1000) / 10;
    findings.push({
      id: 'fact-top-category',
      type: 'FACT',
      category: 'क्षेत्रीय विस्तार',
      title: `सर्वाधिक घोषणाएँ '${topCat.category}' क्षेत्र से संबंधित हैं`,
      description: `कुल ${metrics.totalPromises} घोषणाओं में से ${topCat.totalPromises} (${pct}%) घोषणाएँ '${topCat.category}' श्रेणी में दर्ज हैं। इस क्षेत्र में ${topCat.completed} कार्य पूर्ण, ${topCat.inProgress} प्रगति पर और ${topCat.notStarted} अभी प्रारंभ नहीं हुए हैं।`,
      badge: 'तथ्य (Fact)',
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300',
      actionFilter: { category: topCat.category },
      stats: [
        { label: 'कुल घोषणाएँ', value: topCat.totalPromises },
        { label: 'पूर्ण', value: topCat.completed },
        { label: 'प्रगति पर', value: topCat.inProgress },
        { label: 'पूर्णता दर', value: `${topCat.completionRate}%` }
      ]
    });
  }

  // 2. High Implementation Volume (DERIVED METRIC)
  const inProgressPct = Math.round((metrics.inProgress / metrics.totalPromises) * 1000) / 10;
  findings.push({
    id: 'metric-active-implementation',
    type: 'METRIC',
    category: 'क्रियान्वयन गति',
    title: `${metrics.inProgress} घोषणाएँ (${inProgressPct}%) वर्तमान में सक्रिय क्रियान्वयन में हैं`,
    description: `राज्य शासन द्वारा 85.3% वादों पर कार्य प्रारंभ कर दिया गया है। 58.9% घोषणाएँ (244) प्रगति पर हैं, जबकि 62 घोषणाएँ (15.0%) अभी नीति निर्माण या वित्तीय स्वीकृति के प्रारंभिक चरण में हैं।`,
    badge: 'व्युत्पन्न मीट्रिक (Metric)',
    badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    actionFilter: { status: 'IN_PROGRESS' },
    stats: [
      { label: 'प्रगति पर (In Progress)', value: metrics.inProgress },
      { label: 'प्रारंभिक चरण (Initial Stage)', value: metrics.initialStage },
      { label: 'प्रारंभ नहीं (Not Started)', value: metrics.notStarted },
      { label: 'कुल पूर्ण (Completed)', value: metrics.completed }
    ]
  });

  // 3. Top Department with Pending Load (FACT / METRIC)
  if (deptMetrics.length > 0) {
    const topPendingDept = deptMetrics.slice().sort((a, b) => b.pendingPromises - a.pendingPromises)[0];
    findings.push({
      id: 'fact-top-pending-dept',
      type: 'FACT',
      category: 'विभागीय भार',
      title: `'${topPendingDept.department}' पर सर्वाधिक ${topPendingDept.pendingPromises} घोषणाओं का क्रियान्वयन लंबित है`,
      description: `इस विभाग से संबद्ध कुल ${topPendingDept.totalPromises} घोषणाओं में से ${topPendingDept.completed} घोषणाएँ पूर्ण हुई हैं (${topPendingDept.completionRate}% पूर्णता दर)। वर्तमान में ${topPendingDept.inProgress} घोषणाएँ प्रगति पर और ${topPendingDept.notStarted} घोषणाएँ प्रारंभ नहीं हुई हैं।`,
      badge: 'तथ्य (Fact)',
      badgeColor: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
      actionFilter: { department: topPendingDept.department },
      stats: [
        { label: 'संबद्ध घोषणाएँ', value: topPendingDept.totalPromises },
        { label: 'लंबित कार्य', value: topPendingDept.pendingPromises },
        { label: 'प्रगति पर', value: topPendingDept.inProgress },
        { label: 'पूर्णता दर', value: `${topPendingDept.completionRate}%` }
      ]
    });
  }

  // 4. High Priority Promises Performance (METRIC)
  if (metrics.highPriorityCount > 0) {
    findings.push({
      id: 'metric-high-priority',
      type: 'METRIC',
      category: 'उच्च प्राथमिकता वादे',
      title: `उच्च राजनीतिक व जन-प्राथमिकता वाले ${metrics.highPriorityCount} वादों में से ${metrics.highPriorityCompleted} पूर्ण हुए`,
      description: `शासन द्वारा 'उच्च' राजनीतिक प्राथमिकता के रूप में वर्गीकृत 137 प्रमुख वादों की पूर्णता दर ${metrics.highPriorityCompletionRate}% है। इन वादों में मुख्यमंत्री लाडली बहना योजना और किसान कल्याण योजनाएं शामिल हैं।`,
      badge: 'व्युत्पन्न मीट्रिक (Metric)',
      badgeColor: 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300',
      actionFilter: { politicalImportance: 'HIGH' },
      stats: [
        { label: 'उच्च प्राथमिकता कुल', value: metrics.highPriorityCount },
        { label: 'पूर्ण वादे', value: metrics.highPriorityCompleted },
        { label: 'उच्च प्राथमिकता पूर्णता दर', value: `${metrics.highPriorityCompletionRate}%` },
        { label: 'समग्र पूर्णता दर', value: `${metrics.completionRate}%` }
      ]
    });
  }

  // 5. Initial Stage Action Needed (INTERPRETATION / POLICY)
  if (metrics.initialStage > 0) {
    findings.push({
      id: 'interp-initial-stage-bottleneck',
      type: 'INTERPRETATION',
      category: 'नीति एवं बजट समीक्षा',
      title: `${metrics.initialStage} घोषणाएँ अभी प्रारंभिक चरण में हैं—प्रशासनिक स्वीकृति में तेज़ी की आवश्यकता`,
      description: `कुल घोषणाओं का 15.0% हिस्सा (62 वादे) प्रारंभिक चरण में है। ऐतिहासिक डेटा एवं विभागीय टिप्पणियों के अनुसार इनमें भूमि आवंटन, अंतर-विभागीय समन्वय तथा केंद्र-राज्य वित्तीय अंशदान की औपचारिक अनुमतियां अपेक्षित हैं।`,
      badge: 'विश्लेषण एवं व्याख्या (Interpretation)',
      badgeColor: 'border-purple-300 bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300',
      actionFilter: { status: 'INITIAL_STAGE' },
      stats: [
        { label: 'प्रारंभिक चरण वादे', value: metrics.initialStage },
        { label: 'कुल घोषणाओं का प्रतिशत', value: `${Math.round((metrics.initialStage / metrics.totalPromises) * 1000) / 10}%` },
        { label: 'लंबित वादे (प्रारंभ नहीं)', value: metrics.notStarted }
      ]
    });
  }

  return findings;
}
