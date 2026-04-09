import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Globe, 
  Zap, 
  Users, 
  Activity,
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

const data = [
  { name: 'Mon', deployments: 4 },
  { name: 'Tue', deployments: 7 },
  { name: 'Wed', deployments: 5 },
  { name: 'Thu', deployments: 12 },
  { name: 'Fri', deployments: 9 },
  { name: 'Sat', deployments: 3 },
  { name: 'Sun', deployments: 6 },
];

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [recentDeployments, setRecentDeployments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDeployments: 0,
    activeTeams: 0,
    uptime: '99.99%'
  });

  useEffect(() => {
    if (!user) return;

    // Listen to projects
    const qProjects = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setStats(prev => ({ ...prev, totalProjects: snapshot.size }));
    });

    // Mock some recent activity for now since we don't have deployments yet
    setRecentDeployments([
      { id: '1', projectName: 'ViteHost Landing', status: 'live', createdAt: new Date(), version: 'v1.2.4' },
      { id: '2', projectName: 'Admin Dashboard', status: 'building', createdAt: new Date(Date.now() - 1000 * 60 * 30), version: 'v0.8.2' },
      { id: '3', projectName: 'API Service', status: 'live', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), version: 'v2.1.0' },
    ]);

    return () => {
      unsubscribeProjects();
    };
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass mesh-gradient mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              Welcome back, <span className="text-gradient">{user?.displayName?.split(' ')[0]}</span>
            </motion.h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl">
              Your enterprise-grade hosting platform is ready. Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="glass hover:bg-white/20 dark:hover:bg-white/5 border-white/20">
              View Analytics
            </Button>
            <Button className="bg-vibrant-gradient text-white shadow-lg shadow-vibrant-purple/20 hover:opacity-90 transition-opacity px-6 py-6 h-auto text-lg font-semibold rounded-2xl">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-vibrant-blue/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-vibrant-pink/20 blur-[100px] rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Projects</CardTitle>
            <div className="p-2 bg-vibrant-blue/10 rounded-lg">
              <Globe className="h-4 w-4 text-vibrant-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-vibrant-blue font-medium mt-1">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="glass hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Deployments</CardTitle>
            <div className="p-2 bg-vibrant-purple/10 rounded-lg">
              <Zap className="h-4 w-4 text-vibrant-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">124</div>
            <p className="text-xs text-vibrant-purple font-medium mt-1">+18% from last week</p>
          </CardContent>
        </Card>
        <Card className="glass hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Active Teams</CardTitle>
            <div className="p-2 bg-vibrant-pink/10 rounded-lg">
              <Users className="h-4 w-4 text-vibrant-pink" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-vibrant-pink font-medium mt-1">2 pending invites</p>
          </CardContent>
        </Card>
        <Card className="glass hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">System Uptime</CardTitle>
            <div className="p-2 bg-vibrant-green/10 rounded-lg">
              <Activity className="h-4 w-4 text-vibrant-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uptime}</div>
            <p className="text-xs text-vibrant-green font-medium mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6">
            <Badge variant="outline" className="bg-vibrant-blue/10 text-vibrant-blue border-vibrant-blue/20">Real-time</Badge>
          </div>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>Requests per second across your edge network.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorDeploy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px', 
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deployments" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDeploy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest deployments and system events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentDeployments.map((deployment) => (
                <div key={deployment.id} className="flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    deployment.status === 'live' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{deployment.projectName}</p>
                      <span className="text-xs text-zinc-500">{formatDistanceToNow(deployment.createdAt)} ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono">
                        {deployment.version}
                      </Badge>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {deployment.status === 'live' ? 'Successfully deployed' : 'Deployment in progress'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Projects</h2>
          <Button variant="link" className="text-zinc-900 dark:text-white">View all projects</Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Card 
                key={project.id} 
                className="group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <Badge variant={project.status === 'live' ? 'default' : 'secondary'} className={
                      project.status === 'live' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{project.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(project.createdAt.toDate())} ago
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {project.subdomain}.vitehost.app
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <Globe className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-xs">
                Create your first project to start deploying your Vite applications.
              </p>
              <Button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
