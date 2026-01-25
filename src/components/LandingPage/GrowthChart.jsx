import { TrendingUp, Award, Zap } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart"

// Data showing a person's journey from "Solo Learner" to "Elite Developer"
const personalGrowthData = [
  { stage: "Week 1", skill: 10, confidence: 15 },
  { stage: "Week 4", skill: 25, confidence: 30 },
  { stage: "Week 8", skill: 45, confidence: 40 },
  { stage: "Week 12", skill: 60, confidence: 75 },
  { stage: "Week 16", skill: 85, confidence: 80 },
  { stage: "Week 20", skill: 98, confidence: 95 },
]

const chartConfig = {
  skill: {
    label: "Technical Skill",
    color: "rgb(59, 130, 246)",
  },
  confidence: {
    label: "Professional Confidence",
    color: "rgb(147, 51, 234)",
  },
}

export default function UserSuccessChart() {
  return (
    <section className="w-full py-16 px-6 relative overflow-hidden">
      {/* Visual background flair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Card className="max-w-5xl mx-auto border-none bg-transparent shadow-none relative z-10">
        <CardHeader className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" /> The Compend Effect
            </span>
          </div>
          <CardTitle className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
            Your Path to Mastery
          </CardTitle>
          <CardDescription className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Don't just code. Transform. See how a typical user scales their 
            expertise and career confidence within our ecosystem.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-0 pt-6">
          <ChartContainer config={chartConfig} className="aspect-[16/9] md:aspect-[21/9] w-full">
            <AreaChart
              data={personalGrowthData}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSkill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(147, 51, 234)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(147, 51, 234)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ffffff" opacity={0.05} />
              <XAxis 
                dataKey="stage" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}}
                dy={15}
              />
              <ChartTooltip
                cursor={{ stroke: '#334155', strokeWidth: 2 }}
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone"
                dataKey="skill"
                stroke="rgb(59, 130, 246)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorSkill)"
              />
              <Area
                type="monotone"
                dataKey="confidence"
                stroke="rgb(147, 51, 234)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorConfidence)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none mb-1">98% Success Rate</p>
              <p className="text-slate-500 text-sm">Users reporting career growth in 6 months.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <Award className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none mb-1">Elite Status</p>
              <p className="text-slate-500 text-sm">Average time to reach top-tier ranking.</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}