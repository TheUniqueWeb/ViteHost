import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Globe, 
  Zap, 
  Settings, 
  Terminal, 
  Activity, 
  ExternalLink, 
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from '../components/ui/dialog';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const fetchProject = async () => {
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProject({ id: docSnap.id, ...data });
        if (data.envVars) {
          setEnvVars(Object.entries(data.envVars).map(([key, value]) => ({ key, value: value as string })));
        }
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
      setLoading(false);
    };

    fetchProject();

    // Listen to deployments
    const q = query(
      collection(db, `projects/${id}/deployments`),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeployments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  const handleCopyUrl = () => {
    if (!project) return;
    navigator.clipboard.writeText(`${project.subdomain}.vitehost.app`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copied to clipboard');
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleSaveEnvVars = async () => {
    if (!id) return;
    const envObj = envVars.reduce((acc, curr) => {
      if (curr.key.trim()) acc[curr.key] = curr.value;
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'projects', id), { envVars: envObj });
      toast.success('Environment variables saved');
    } catch (error) {
      toast.error('Failed to save environment variables');
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    
    try {
      await deleteDoc(doc(db, 'projects', id));
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading project...</div>;
  if (!project) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'live' ? 'default' : 'secondary'} className={
              project.status === 'live' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
            }>
              {project.status}
            </Badge>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">{project.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 glass border-zinc-200 dark:border-zinc-800 hover:bg-vibrant-blue/5" onClick={handleCopyUrl}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {project.subdomain}.{project.baseDomain || 'vitehost.app'}
          </Button>
          <Button nativeButton={false} className="bg-vibrant-gradient text-white shadow-lg shadow-vibrant-purple/20 hover:opacity-90 transition-opacity" render={
            <a href={`https://${project.subdomain}.${project.baseDomain || 'vitehost.app'}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit Site
            </a>
          } />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deployments" className="rounded-lg gap-2">
            <Zap className="w-4 h-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg gap-2">
            <Terminal className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="env" className="rounded-lg gap-2">
            <Activity className="w-4 h-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Production Deployment</CardTitle>
                <CardDescription>The current live version of your project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Preview
                    </Button>
                  </div>
                  <Globe className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Deployment</span>
                  <span className="font-mono">v1.2.4</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Domains</span>
                  <span className="text-vibrant-blue font-medium">{project.subdomain}.{project.baseDomain || 'vitehost.app'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>Recent events and changes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {deployments.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        d.status === 'live' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Deployment {d.version}</p>
                        <p className="text-xs text-zinc-500">
                          {d.status === 'live' ? 'Deployed successfully' : 'Building...'}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {d.createdAt ? formatDistanceToNow(d.createdAt.toDate()) : 'Just now'} ago
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployments">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>A list of all deployments for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {d.status === 'live' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-yellow-500" />}
                      <div>
                        <p className="text-sm font-medium">Deployment {d.version}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>main</span>
                          <span>·</span>
                          <span>{d.createdAt ? formatDistanceToNow(d.createdAt.toDate()) : 'Just now'} ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{d.status}</Badge>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 hover:text-vibrant-purple" onClick={() => toast.info(`Rolling back to ${d.version}...`)}>
                        <Clock className="w-3 h-3" />
                        Rollback
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="glass border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-zinc-950 text-zinc-100 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-vibrant-blue" />
                  <CardTitle className="text-sm">Build Logs - v1.2.4</CardTitle>
                </div>
                <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">Success</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-zinc-950 p-6 font-mono text-xs text-zinc-400 space-y-1 max-h-[500px] overflow-y-auto">
                <p><span className="text-zinc-600">[16:30:12]</span> <span className="text-vibrant-blue">info</span> Initializing build environment...</p>
                <p><span className="text-zinc-600">[16:30:14]</span> <span className="text-vibrant-blue">info</span> Cloning repository...</p>
                <p><span className="text-zinc-600">[16:30:18]</span> <span className="text-vibrant-blue">info</span> Installing dependencies (npm install)...</p>
                <p><span className="text-zinc-600">[16:30:45]</span> <span className="text-vibrant-blue">info</span> Running build script (vite build)...</p>
                <p><span className="text-zinc-600">[16:30:52]</span> <span className="text-zinc-100">vite v6.2.0 building for production...</span></p>
                <p><span className="text-zinc-600">[16:30:53]</span> <span className="text-green-400">✓ 42 modules transformed.</span></p>
                <p><span className="text-zinc-600">[16:30:54]</span> <span className="text-zinc-100">dist/index.html                  0.45 kB</span></p>
                <p><span className="text-zinc-600">[16:30:54]</span> <span className="text-zinc-100">dist/assets/index-D1B2C3D4.js   142.30 kB │ gzip: 45.12 kB</span></p>
                <p><span className="text-zinc-600">[16:30:54]</span> <span className="text-zinc-100">dist/assets/index-A1B2C3D4.css   24.15 kB │ gzip:  6.42 kB</span></p>
                <p><span className="text-zinc-600">[16:30:55]</span> <span className="text-vibrant-blue">info</span> Uploading build artifacts to edge network...</p>
                <p><span className="text-zinc-600">[16:30:58]</span> <span className="text-green-400">success</span> Deployment live at: {project.subdomain}.{project.baseDomain || 'vitehost.app'}</p>
                <div className="pt-4 animate-pulse">
                  <span className="text-vibrant-purple">_</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="env">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>Configure secrets and variables for your project.</CardDescription>
              </div>
              <Button onClick={handleSaveEnvVars} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {envVars.map((env, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input 
                    placeholder="KEY" 
                    className="font-mono"
                    value={env.key}
                    onChange={(e) => {
                      const newVars = [...envVars];
                      newVars[index].key = e.target.value;
                      setEnvVars(newVars);
                    }}
                  />
                  <Input 
                    placeholder="VALUE" 
                    type="password"
                    value={env.value}
                    onChange={(e) => {
                      const newVars = [...envVars];
                      newVars[index].value = e.target.value;
                      setEnvVars(newVars);
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveEnvVar(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed" onClick={handleAddEnvVar}>
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card className="glass border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Build Settings</CardTitle>
                <CardDescription>Configure how your project is built and deployed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-500">Build Command</label>
                  <Input placeholder="npm run build" defaultValue="npm run build" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-500">Output Directory</label>
                  <Input placeholder="dist" defaultValue="dist" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-500">Install Command</label>
                  <Input placeholder="npm install" defaultValue="npm install" />
                </div>
                <Button className="w-full bg-vibrant-gradient text-white">Save Build Settings</Button>
              </CardContent>
            </Card>

            <Card className="glass border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Custom Domains</CardTitle>
                <CardDescription>Connect your own domain to this project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input placeholder="example.com" className="flex-1" />
                  <Button className="bg-vibrant-gradient text-white">Add Domain</Button>
                </div>
                <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-vibrant-blue" />
                    <div>
                      <p className="text-sm font-medium">www.my-awesome-site.com</p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50/50 dark:bg-red-900/10">
                <div>
                  <p className="text-sm font-medium">Delete Project</p>
                  <p className="text-xs text-zinc-500">This will permanently delete your project and all deployments.</p>
                </div>
                <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>Delete Project</Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the project
                  <span className="font-bold text-zinc-900 dark:text-white mx-1">"{project.name}"</span>
                  and remove all associated deployments from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteProject}>Delete Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
